import { List, styled } from "@mui/material";

export const SparseList = styled(List)(() => ({
  padding: 0,
  "& .MuiListItemButton-root": { minHeight: 60 },
}));
