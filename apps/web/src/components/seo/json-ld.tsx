type JsonLdProps = {
  data: Record<string, unknown>;
  nonce?: string;
};

/**
 * A JSON-LD block. The data is serialized with `<` escaped so a title
 * containing "</script>" cannot close the tag; a structured-data script is
 * never executed, so it needs no nonce for CSP, but one is accepted for
 * hosts that scan every script tag.
 */
export const JsonLd = ({ data, nonce }: JsonLdProps) => (
  <script
    type="application/ld+json"
    nonce={nonce}
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    }}
  />
);
