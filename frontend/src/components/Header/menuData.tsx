import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "Home",
    path: "/",
    newTab: false,
  },
  {
    id: 2,
    title: "Company",
    newTab: false,
    submenu: [
      {
        id: 21,
        title: "About",
        path: "/about",
        newTab: false,
      },
      {
        id: 22,
        title: "Support",
        path: "/contact",
        newTab: false,
      },
      {
        id: 23,
        title: "FAQ",
        path: "/faq",
        newTab: false,
      },
    ],
  },
  {
    id: 3,
    title: "Properties",
    newTab: false,
    submenu: [
      {
        id: 31,
        title: "HMO",
        path: "/hmo",
        newTab: false,
      },
      {
        id: 32,
        title: "Listings",
        path: "/listings",
        newTab: false,
      },
    ],
  },
  {
    id: 4,
    title: "Documents",
    newTab: false,
    submenu: [], // Will be populated dynamically from API
  },
  {
    id: 5,
    title: "Forum",
    path: "/forum",
    newTab: false,
  },
];

export default menuData;
