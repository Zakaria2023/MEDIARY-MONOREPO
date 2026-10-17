import {
  CanvasTexture,
  Color,
  Fog,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";
import { catalogImageUrl } from "utils";
import { ScenePoster } from "@/lib/scene-poster";

type PosterSceneOptions = {
  posters: ScenePoster[];
  /** The page's color, which the far side of the carousel fades into. */
  pageColor: string;
  /** The color a poster without a dominant color starts as. */
  surfaceColor: string;
  /** Called once the first frame is drawn, so the canvas can take over from the CSS wall. */
  onReady: () => void;
};

type Card = {
  mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  /** The card's angle around its ring, which never changes. */
  angle: number;
  /** When, in seconds after mounting, its entrance starts. */
  delay: number;
  lift: number;
};

const ROWS = 3;
const POSTER_WIDTH = 1.6;
const POSTER_HEIGHT = 2.4;
const PITCH = 1.95;
const ROW_GAP = 0.38;
const SPIN_PER_SECOND = 0.06;
const POINTER_REACH = 0.12;
const ENTRANCE_SECONDS = 1.1;
const TEXTURE_WIDTH = 342;

/** Hosts that do not send CORS headers; their images come through the site's own image route instead. */
const SAME_ORIGIN_HOSTS = ["media.kitsu.app"];

/** A poster lighter than this reads as a hole in the wall behind the page's scrim. */
const DARKEST_LIGHTNESS = 0.14;

/** Smaller than this, an image is a source's "no cover" placeholder, not a poster. */
const SMALLEST_IMAGE = 16;

/** The poster through the site's own image route, which any listed catalog host can be read through. */
const sameOriginUrl = (src: string): string => `/_next/image?url=${encodeURIComponent(src)}&w=384&q=70`;

/**
 * The address a poster's pixels can be read from by WebGL. The CSS wall has
 * usually fetched the same image already, without CORS, and the browser
 * would hand WebGL that cached copy, which it may not read; the query makes
 * it a request of its own.
 */
const textureUrl = (src: string): string => {
  if (SAME_ORIGIN_HOSTS.some((host) => src.includes(`//${host}/`))) {
    return sameOriginUrl(src);
  }
  const url = catalogImageUrl(src, TEXTURE_WIDTH);
  return `${url}${url.includes("?") ? "&" : "?"}texture=1`;
};

/**
 * The posters worth putting on the rings: near-black covers are left out
 * while there are enough lighter ones to fill every slot twice over, since
 * behind the scrim a black sleeve looks like a card that never loaded.
 */
const visiblePosters = (posters: ScenePoster[], slots: number): ScenePoster[] => {
  const hsl = { h: 0, s: 0, l: 0 };
  const light = posters.filter((poster) => !poster.color || new Color(poster.color).getHSL(hsl).l >= DARKEST_LIGHTNESS);
  return light.length >= slots / 2 ? light : posters;
};

/** One shared mask that rounds every poster's corners the way a card is rounded on the page. */
const roundedMask = (): CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 240;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#000";
    context.fillRect(0, 0, 160, 240);
    context.fillStyle = "#fff";
    context.beginPath();
    context.roundRect(0, 0, 160, 240, 14);
    context.fill();
  }
  return new CanvasTexture(canvas);
};

/** Ease out, fast then settling, for the entrance. */
const easeOut = (progress: number): number => 1 - (1 - progress) ** 3;

/**
 * THE LANDING'S POSTER CAROUSEL: the catalog's most followed titles on
 * three rings, turning in opposite directions behind the promise, with the
 * far side fading into the page. The wall leans toward the pointer, a
 * poster under it lifts, and scrolling past the hero pulls the camera back.
 * Decoration only: nothing on the page depends on it. Pauses off-screen,
 * caps the pixel ratio, and returns its own teardown.
 */
export const mountPosterScene = (
  container: HTMLElement,
  { posters: given, pageColor, surfaceColor, onReady }: PosterSceneOptions,
): (() => void) => {
  if (given.length === 0) {
    return () => {};
  }
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  } catch {
    // No WebGL: the CSS wall stays where it is.
    return () => {};
  }

  const width = () => container.clientWidth || 1;
  const height = () => container.clientHeight || 1;
  const small = () => width() < 640;
  const perRow = small() ? 16 : 22;
  const radius = (perRow * PITCH) / (Math.PI * 2);
  const distance = () => radius + (small() ? 12.5 : 8.2);
  const posters = visiblePosters(given, perRow * ROWS);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width(), height(), false);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  scene.fog = new Fog(new Color(pageColor), distance(), distance() + radius * 1.25);
  const camera = new PerspectiveCamera(40, width() / height(), 0.1, 100);
  camera.position.set(0, 0, distance());

  const geometry = new PlaneGeometry(POSTER_WIDTH, POSTER_HEIGHT);
  const mask = roundedMask();
  const loader = new TextureLoader();
  loader.setCrossOrigin("anonymous");
  const textures: Texture[] = [];
  const loaded = new Map<string, MeshBasicMaterial[]>();
  let disposed = false;

  /** Puts a poster's image on every card showing it, once it has really arrived. */
  const applyPoster = (src: string, texture: Texture) => {
    const image = texture.image as { width?: number } | undefined;
    if (disposed || (image?.width ?? 0) < SMALLEST_IMAGE) {
      // A source's "no cover" placeholder: the card keeps its own color.
      texture.dispose();
      return;
    }
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    textures.push(texture);
    for (const target of loaded.get(src) ?? []) {
      target.map = texture;
      target.color.set(0xffffff);
      target.needsUpdate = true;
    }
  };

  /**
   * Loads a poster straight from its source, and through the site's own
   * image route if WebGL may not read it from there. One that fails both
   * ways keeps its own color: the slot never empties.
   */
  const loadPoster = (src: string) => {
    const direct = textureUrl(src);
    const fallback = sameOriginUrl(src);
    loader.load(
      direct,
      (texture) => applyPoster(src, texture),
      undefined,
      () => {
        if (!disposed && direct !== fallback) {
          loader.load(fallback, (texture) => applyPoster(src, texture));
        }
      },
    );
  };

  const wall = new Group();
  wall.rotation.z = -0.1;
  scene.add(wall);
  const rings: Group[] = [];
  const cards: Card[] = [];

  for (let row = 0; row < ROWS; row += 1) {
    const ring = new Group();
    ring.position.y = (1 - row) * (POSTER_HEIGHT + ROW_GAP);
    // Every other row is shifted half a poster, like bricks.
    ring.rotation.y = row % 2 === 0 ? 0 : Math.PI / perRow;
    wall.add(ring);
    rings.push(ring);
    for (let slot = 0; slot < perRow; slot += 1) {
      const poster = posters[(row * perRow + slot) % posters.length];
      if (!poster) {
        continue;
      }
      const material = new MeshBasicMaterial({
        color: new Color(poster.color ?? surfaceColor),
        alphaMap: mask,
        transparent: true,
        opacity: 0,
      });
      const mesh = new Mesh(geometry, material);
      const angle = (slot / perRow) * Math.PI * 2;
      mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
      mesh.rotation.y = angle;
      ring.add(mesh);
      // The cards facing the visitor arrive first, the rest ripple outward.
      const facing = Math.min(slot, perRow - slot) / perRow;
      cards.push({ mesh, angle, delay: 0.15 + facing * 0.9 + row * 0.08, lift: 0 });

      const waiting = loaded.get(poster.src);
      if (waiting) {
        waiting.push(material);
        continue;
      }
      loaded.set(poster.src, [material]);
      loadPoster(poster.src);
    }
  }

  const pointer = new Vector2(0, 0);
  const pointerSeen = { value: false };
  const onPointerMove = (event: PointerEvent) => {
    pointer.set((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY / window.innerHeight) * 2 - 1));
    pointerSeen.value = true;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  const resize = new ResizeObserver(() => {
    camera.aspect = width() / height();
    camera.updateProjectionMatrix();
    renderer.setSize(width(), height(), false);
  });
  resize.observe(container);

  const raycaster = new Raycaster();
  const meshes = cards.map((card) => card.mesh);
  const started = performance.now();
  let frame = 0;
  let visible = true;
  let last = started;
  let drawn = false;

  const draw = (now: number) => {
    const seconds = Math.min((now - last) / 1000, 0.05);
    const elapsed = (now - started) / 1000;
    last = now;

    // Scrolling past the hero pulls the camera back and quickens the turn.
    const scrolled = Math.min(Math.max(window.scrollY / Math.max(height(), 1), 0), 1);
    camera.position.z = distance() + scrolled * 4;
    rings.forEach((ring, index) => {
      ring.rotation.y += (index % 2 === 0 ? 1 : -1) * SPIN_PER_SECOND * (1 + scrolled * 2) * seconds;
    });
    wall.rotation.x += (pointer.y * -POINTER_REACH - wall.rotation.x) * 0.05;
    wall.rotation.y += (pointer.x * POINTER_REACH - wall.rotation.y) * 0.05;

    raycaster.setFromCamera(pointer, camera);
    const hovered = pointerSeen.value ? raycaster.intersectObjects(meshes, false)[0]?.object : undefined;

    for (const card of cards) {
      const entrance = easeOut(Math.min(Math.max((elapsed - card.delay) / ENTRANCE_SECONDS, 0), 1));
      card.lift += ((card.mesh === hovered ? 1 : 0) - card.lift) * 0.12;
      const reach = radius + (1 - entrance) * 3 + card.lift * 0.45;
      card.mesh.position.set(Math.sin(card.angle) * reach, (1 - entrance) * -0.6, Math.cos(card.angle) * reach);
      card.mesh.scale.setScalar(1 + card.lift * 0.06);
      card.mesh.material.opacity = entrance;
    }

    renderer.render(scene, camera);
    if (!drawn) {
      drawn = true;
      onReady();
    }
    frame = visible ? requestAnimationFrame(draw) : 0;
  };

  const seen = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (visible && frame === 0) {
      last = performance.now();
      frame = requestAnimationFrame(draw);
    }
  });
  seen.observe(container);
  frame = requestAnimationFrame(draw);

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    seen.disconnect();
    resize.disconnect();
    window.removeEventListener("pointermove", onPointerMove);
    for (const card of cards) {
      card.mesh.material.dispose();
    }
    for (const texture of textures) {
      texture.dispose();
    }
    geometry.dispose();
    mask.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
};
