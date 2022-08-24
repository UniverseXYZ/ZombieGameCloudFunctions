
export interface User {
  _id: string;
  id: string;
  walletAddress: string;
  idIsUsed: string;
  score: number;
  enemyKillCount: number;
  wave: number;
  timeInSeconds: number;
}

export interface GetUserEligibleRespose {
  isEligible: boolean;
  walletAddress?: string;
  score?: number;
  enemyKillCount?: number;
  wave?: number;
  timeInSeconds?: number;
}

export interface TheGraphResponse {
  transferEntities: PolyMorph[];
}

export interface PolyMorph {
  tokenId: string;
}

export interface MetaDataResponse {
  name: string;
  imageurl: string;
  character: string;
}

export interface SetUserScoreArgs {
  score?: number;
  walletAddress: string;
  enemyKillCount?: number;
  wave?: number;
  timeInSeconds?: number;
}
