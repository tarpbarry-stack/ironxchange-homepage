export function renderAuctionPanel({
    face,
    listing,
    ...
}) {

    switch (face) {

        case 1:
            return <AOF1 .../>

        case 2:
            return <AOF2 .../>

        case 3:
            return <AOF3 .../>

        case 4:
            return <AOF4 .../>

        default:
            return null;
    }
}
