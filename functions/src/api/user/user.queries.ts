import { gql } from 'graphql-request';

export const GET_POLYMORPHS_QUERY = gql`
  query($walletAddress:String){
    transferEntities(first: 1000, where: { to:$walletAddress}) {
      tokenId
    }
  }
`;

export const GET_DEVIANTS_QUERY = gql`
  query($walletAddress:String){
    transferEntities(first: 1000, where: { to:$walletAddress}) {
      tokenId
    }
  }
`;
