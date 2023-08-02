/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreatePresentation = /* GraphQL */ `
  subscription OnCreatePresentation(
    $filter: ModelSubscriptionPresentationFilterInput
    $owner: String
  ) {
    onCreatePresentation(filter: $filter, owner: $owner) {
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
export const onUpdatePresentation = /* GraphQL */ `
  subscription OnUpdatePresentation(
    $filter: ModelSubscriptionPresentationFilterInput
    $owner: String
  ) {
    onUpdatePresentation(filter: $filter, owner: $owner) {
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
export const onDeletePresentation = /* GraphQL */ `
  subscription OnDeletePresentation(
    $filter: ModelSubscriptionPresentationFilterInput
    $owner: String
  ) {
    onDeletePresentation(filter: $filter, owner: $owner) {
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
