/**
 * One poster on the landing's 3D carousel. Its own file, apart from the
 * scene, so the components that pass posters along never import the
 * renderer and pull it into the first screen's bundle.
 */
export type ScenePoster = {
  src: string;
  /** The artwork's own color, shown until the image arrives. */
  color: string | null;
};
