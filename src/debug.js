const emoteName = "(ditto)"

const message = "(ditto) (ditto)"

const emoteRegex = new RegExp(`\\b${emoteName}\\b`, `g`);
const matches = [...message.matchAll(emoteRegex)];


for (const match of matches) {
  console.log(match.index)
  console.log(message.charAt(match.index))

}