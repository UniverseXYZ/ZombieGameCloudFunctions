export interface User {
  _id: string;
  id: string;
  walletAddress: string;
  idIsUsed: string;
}

export interface GetUserEligibleRespose {
  isEligible: boolean;
  walletAddress?: string;
}
