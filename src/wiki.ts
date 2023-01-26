import fetch from "node-fetch";

const getURL = (id: number) =>
  `https://game8.co/games/Monster-Hunter-Rise/archives/${id}`;

export const getPage = (id: number) =>
  fetch(getURL(id))
    .then((res) => res.text())
    .catch((err) => {
      console.error(err);
    });
