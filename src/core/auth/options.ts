export type Headers = {
  [key: string]: string;
};

export interface AuthOptions {
  params: any;
  headers : Headers;
  withCredentials: boolean;
}
