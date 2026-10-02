declare module "he" {
  interface DecodeOptions {
    isAttributeValue?: boolean;
    strict?: boolean;
  }

  const he: {
    decode(input: string, options?: DecodeOptions): string;
  };

  export default he;
}
