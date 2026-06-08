import { createTheme } from "@mui/material/styles";

const arenaTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1A56DB",
      dark: "#1140B0",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#F5C400",
      dark: "#C49B00",
      contrastText: "#06091A",
    },
    error: {
      main: "#E31B23",
      dark: "#B8141B",
    },
    background: {
      default: "#F8F9FF",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#06091A",
      secondary: "#3D4472",
    },
  },
  typography: {
    fontFamily: '"Barlow", ui-sans-serif, system-ui, -apple-system, sans-serif',
    h1: {
      fontFamily: '"Barlow Condensed", "Oswald", sans-serif',
      fontWeight: 900,
    },
    h2: {
      fontFamily: '"Barlow Condensed", "Oswald", sans-serif',
      fontWeight: 800,
    },
    button: {
      fontFamily: '"Barlow Condensed", "Oswald", sans-serif',
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { overflowX: "hidden" },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
      variants: [
        {
          props: { variant: "contained", color: "primary" },
          style: {
            background: "#1A56DB",
          },
        },
        {
          props: { variant: "contained", color: "secondary" },
          style: {
            background: "#F5C400",
            color: "#06091A",
          },
        },
      ],
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 14,
            background: "#FFFFFF",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          borderRadius: 999,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          height: 6,
          backgroundColor: "rgba(26,86,219,0.1)",
        },
        bar: {
          borderRadius: 3,
        },
      },
    },
  },
});

export default arenaTheme;