import IXISellerMachineObjectFace2
  from "../ixi-machine-object/IXISellerMachineObjectFace2";

import IXIMachineObjectFace3
  from "../ixi-machine-object/IXIMachineObjectFace3";

import IXIMachineObjectFace4
  from "../ixi-machine-object/IXIMachineObjectFace4";

function normalizePrivateFace(
  value,
  fallback = 2
) {
  const face =
    Number(value);

  return [
    2,
    3,
    4
  ].includes(face)
    ? face
    : fallback;
}

export function renderPrivatePanel({
  face,
  listing = {},
  dragHandleProps,

  descriptionValue,
  onDescriptionChange,
  onDescriptionKeyDown,
  savingDescription = false
}) {
  const normalizedFace =
    normalizePrivateFace(
      face
    );

  if (
    normalizedFace === 3
  ) {
    return (
      <IXIMachineObjectFace3
        listing={
          listing
        }

        dragHandleProps={
          dragHandleProps
        }
      />
    );
  }

  if (
    normalizedFace === 4
  ) {
    return (
      <IXIMachineObjectFace4
        listing={
          listing
        }

        dragHandleProps={
          dragHandleProps
        }
      />
    );
  }

  return (
    <IXISellerMachineObjectFace2
      listing={
        listing
      }

      dragHandleProps={
        dragHandleProps
      }

      descriptionValue={
        descriptionValue
      }

      onDescriptionChange={
        onDescriptionChange
      }

      onDescriptionKeyDown={
        onDescriptionKeyDown
      }

      savingDescription={
        savingDescription
      }
    />
  );
}
