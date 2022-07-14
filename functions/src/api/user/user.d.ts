
export interface User {
  _id: string;
  id: string;
  walletAddress: string;
  idIsUsed: string;
  score: string;
}

export interface GetUserEligibleRespose {
  isEligible: boolean;
  walletAddress?: string;
}

export interface TheGraphResponse {
  transferEntities: PolyMorph[];
}

export interface PolyMorph {
  tokenId: string;
}

export interface SetUserScoreArgs {
  score: string;
  walletAddress: string;
}
