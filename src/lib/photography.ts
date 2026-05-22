// Photos are hosted on Unsplash under @riturajworkemail.
// Each entry has three URL variants for performance:
//   - small:   thumbnail-quality (~400w) - used for the blurred backdrop
//   - regular: gallery-quality (~1080w) - used in the horizontal track
//   - full:    print-quality - used in the lightbox

export type Photo = {
  id: string;
  title: string;
  full: string;
  regular: string;
  small: string;
};

const u = (id: string, ix: string) => ({
  full: `https://images.unsplash.com/photo-${id}?crop=entropy&cs=srgb&fm=jpg&ixid=${ix}&ixlib=rb-4.0.3&q=85`,
  regular: `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=${ix}&ixlib=rb-4.0.3&q=80&w=1080`,
  small: `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=${ix}&ixlib=rb-4.0.3&q=80&w=400`,
});

export const photos: Photo[] = [
  {
    id: "1711058846205-fd5d10041329",
    title: "Frame 01",
    ...u("1711058846205-fd5d10041329", "M3w1Nzg3NDR8MHwxfGFsbHx8fHx8fHx8fDE3MTEwNTkyOTN8"),
  },
  {
    id: "1711058846221-34455a39115a",
    title: "Frame 02",
    ...u("1711058846221-34455a39115a", "M3w1Nzg3NDR8MHwxfGFsbHx8fHx8fHx8fDE3MTEwNTk0MTF8"),
  },
  {
    id: "1711058846217-e365c242bdfc",
    title: "Frame 03",
    ...u("1711058846217-e365c242bdfc", "M3w1Nzg3NDR8MHwxfGFsbHx8fHx8fHx8fDE3MTEwNTk0NjV8"),
  },
  {
    id: "1711058962922-9a03ddfb2dba",
    title: "Frame 04",
    ...u("1711058962922-9a03ddfb2dba", "M3w1Nzg3NDR8MHwxfGFsbHx8fHx8fHx8fDE3MTEwNTk1MTZ8"),
  },
  {
    id: "1711058963564-69ae01452215",
    title: "Frame 05",
    ...u("1711058963564-69ae01452215", "M3w1Nzg3NDR8MHwxfGFsbHx8fHx8fHx8fDE3MTEwNTk1NzN8"),
  },
  {
    id: "1711058962902-5f561217259c",
    title: "Frame 06",
    ...u("1711058962902-5f561217259c", "M3w1Nzg3NDR8MHwxfGFsbHx8fHx8fHx8fDE3MTEwNTk2MDZ8"),
  },
  {
    id: "1711058962875-560956ff6d5e",
    title: "Frame 07",
    ...u("1711058962875-560956ff6d5e", "M3w1Nzg3NDR8MHwxfGFsbHx8fHx8fHx8fDE3MTEwNTk4NTB8"),
  },
  {
    id: "1711058997039-85dd2c3a2231",
    title: "Frame 08",
    ...u("1711058997039-85dd2c3a2231", "M3w1Nzg3NDR8MHwxfGFsbHx8fHx8fHx8fDE3MTEwNTk4MDh8"),
  },
  {
    id: "1711058962891-978794507db0",
    title: "Frame 09",
    ...u("1711058962891-978794507db0", "M3w1Nzg3NDR8MHwxfGFsbHx8fHx8fHx8fDE3MTEwNTk3ODB8"),
  },
];

export const photographyLinks = {
  unsplash: "https://unsplash.com/@riturajworkemail",
  instagram: "https://www.instagram.com/riturajkulshresth/",
} as const;
