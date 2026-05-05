export default function handler(req, res) {
  res.status(200).json([
    {
      title: "2023 KOMATSU WA475-10",
      type: "WHEEL LOADERS",
      hours: "5,790 Hrs",
      location: "Post, TX",
      price: "$175,500",
      image: "/images/2023-komatsu-wa475-10.jpg",
      link: "https://staging.ironxchange.com/l/2023-komatsu-wa475-4-989-hrs/69f80a91-ef02-446d-bfa8-61f00353e32e"
    },
    {
      title: "2020 DEERE 772GP",
      type: "MOTOR GRADERS",
      hours: "3,907 Hrs",
      location: "Colorado City, TX",
      price: "$179,000",
      image: "/images/2020-Deere-772GP.jpg",
      link: "https://staging.ironxchange.com/l/2020-deere-772gp-4-790-hrs/69f7ffd8-f07e-4587-a4dd-4a1fa7626d91"
    }
  ]);
}
