import avatar1 from "../assets/avatar1.webp";
import avatar2 from "../assets/avatar2.webp";
import avatar3 from "../assets/avatar3.webp";
import avatar4 from "../assets/avatar4.webp";
import avatar5 from "../assets/avatar5.webp";
import avatar6 from "../assets/avatar6.webp";
import avatar7 from "../assets/avatar7.webp";
import avatar8 from "../assets/avatar8.webp";
import avatar9 from "../assets/avatar9.webp";
import avatar10 from "../assets/avatar10.webp";

export const AVATAR_OPTIONS = [
  { key: "avatar1", src: avatar1 },
  { key: "avatar2", src: avatar2 },
  { key: "avatar3", src: avatar3 },
  { key: "avatar4", src: avatar4 },
  { key: "avatar5", src: avatar5 },
  { key: "avatar6", src: avatar6 },
  { key: "avatar7", src: avatar7 },
  { key: "avatar8", src: avatar8 },
  { key: "avatar9", src: avatar9 },
  { key: "avatar10", src: avatar10 },
];

export function getAvatarSrcByKey(avatarKey) {
  const found = AVATAR_OPTIONS.find((item) => item.key === avatarKey);
  return found?.src || null;
}
