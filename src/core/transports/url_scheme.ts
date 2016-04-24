export interface URLSchemeParams {
  encrypted: boolean;
  hostEncrypted: string;
  hostUnencrypted: string;
  httpPath: string;
}

interface URLScheme {
    getInitial(key : string, params : any) : string;
    getPath?(key : string, options : any) : string;
}

export default URLScheme;
