/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createPresentation = /* GraphQL */ `
  mutation CreatePresentation(
    $input: CreatePresentationInput!
    $condition: ModelPresentationConditionInput
  ) {
    createPresentation(input: $input, condition: $condition) {
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
export const updatePresentation = /* GraphQL */ `
  mutation UpdatePresentation(
    $input: UpdatePresentationInput!
    $condition: ModelPresentationConditionInput
  ) {
    updatePresentation(input: $input, condition: $condition) {
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
export const deletePresentation = /* GraphQL */ `
  mutation DeletePresentation(
    $input: DeletePresentationInput!
    $condition: ModelPresentationConditionInput
  ) {
    deletePresentation(input: $input, condition: $condition) {
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
