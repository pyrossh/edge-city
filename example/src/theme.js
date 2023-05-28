import { createStitches } from '@stitches/react';

export const { styled, createTheme, getCssText } = createStitches({
  theme: {
    colors: {
      primary: 'blueviolet',
      secondary: 'gainsboro',
    }
  },
});