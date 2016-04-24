interface Action {
  action: string;
  id?: string;
  activityTimeout?: number;
  error?: any;
}

export default Action;
