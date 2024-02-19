import React from "react";
import { Slide } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";

export const SlideLeft = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="left" ref={ref} {...props} />;
});
