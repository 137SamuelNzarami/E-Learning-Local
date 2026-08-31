import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Nœud <video> minimal pour TipTap.
 * - bloc autonome avec src obligatoire ;
 * - controls toujours actif à l'affichage ;
 * - la sanitation au rendu est gérée par utils/richText.js.
 */
const Video = Node.create({
  name: "video",
  group: "block",
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, { controls: "" })];
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    };
  },
});

export default Video;
