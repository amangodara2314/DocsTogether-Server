const animals = [
  "Owl",
  "Fox",
  "Koala",
  "Panda",
  "Otter",
  "Sloth",
  "Raccoon",
  "Bear",
  "Duck",
  "Tiger",
];
const emojis = ["🦉", "🦊", "🐨", "🐼", "🦦", "🦥", "🦝", "🐻", "🦆", "🐯"];

export function generateAnonName() {
  const index = Math.floor(Math.random() * animals.length);
  return `Anonymous ${animals[index]} ${emojis[index]}`;
}

export function getRandomAvatar() {
  const seed = Math.floor(Math.random() * 100000);
  return `https://api.dicebear.com/6.x/thumbs/svg?seed=${seed}`;
}
