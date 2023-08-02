/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getPresentation = /* GraphQL */ `
  query GetPresentation($id: ID!) {
    getPresentation(id: $id) {
      id
      EyeContact
      SpeakingPaceRealTime
      SpeakingPacePerMin
      Engagement
      FillerWords
      WeaselWords
      BiasEmotionSpecificWords
      owner
      PresentationTime
      sub
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listPresentations = /* GraphQL */ `
  query ListPresentations(
    $filter: ModelPresentationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPresentations(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        EyeContact
        SpeakingPaceRealTime
        SpeakingPacePerMin
        Engagement
        FillerWords
        WeaselWords
        BiasEmotionSpecificWords
        owner
        PresentationTime
        sub
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
