type JsonLdProps = {
  data: Record<string, unknown>;
};

/**
 * A JSON-LD block. The data is serialized with `<` escaped so a title
 * containing "</script>" cannot close the tag. It carries no nonce: a
 * structured-data script is never executed, so CSP does not govern it, and
 * browsers hide a nonce attribute from the DOM once a policy is enforced,
 * which made React report a hydration mismatch on every page.
 */
export const JsonLd = ({ data }: JsonLdProps) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, "\u003c"),
    }}
  />
);
