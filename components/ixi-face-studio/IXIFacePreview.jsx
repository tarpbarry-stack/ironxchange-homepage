switch(face){

case "AOF2":

return (
  <IXIAuctionObjectFace2
      listing={previewMachine}
      ...
  />
);

case "AOF3":

return (
  <IXIAuctionObjectFace3
      listing={previewMachine}
      ...
  />
);

case "MOF2":

return (
  <IXIMachineObjectFace2
      listing={previewMachine}
  />
);

}
