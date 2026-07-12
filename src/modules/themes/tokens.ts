export interface ThemeTokens {
  name: string;
  fg: string;
  bg: string;
  accent: string;
  lineNumbers: string;
  selection: string;
  focus: string;
  gitAdded: string;
  gitModified: string;
  gitDeleted: string;
  syntax: {
    keyword: string;
    string: string;
    comment: string;
    function: string;
    type: string;
    number: string;
  };
  callout: {
    note: string;
    warning: string;
    tip: string;
  };
}

export const darkTheme: ThemeTokens = {
  name: "ink-dark",
  fg: "#d4d4d4",
  bg: "#1e1e1e",
  accent: "#569cd6",
  lineNumbers: "#858585",
  selection: "#264f78",
  focus: "#094771",
  gitAdded: "#4ec9b0",
  gitModified: "#dcdcaa",
  gitDeleted: "#f44747",
  syntax: {
    keyword: "#569cd6",
    string: "#ce9178",
    comment: "#6a9955",
    function: "#dcdcaa",
    type: "#4ec9b0",
    number: "#b5cea8",
  },
  callout: {
    note: "#569cd6",
    warning: "#dcdcaa",
    tip: "#4ec9b0",
  },
};

export const lightTheme: ThemeTokens = {
  name: "ink-light",
  fg: "#3b3b3b",
  bg: "#ffffff",
  accent: "#0066b8",
  lineNumbers: "#9d9d9d",
  selection: "#add6ff",
  focus: "#d6eaff",
  gitAdded: "#008000",
  gitModified: "#808000",
  gitDeleted: "#e51400",
  syntax: {
    keyword: "#0000ff",
    string: "#a31515",
    comment: "#008000",
    function: "#795e26",
    type: "#267f99",
    number: "#098658",
  },
  callout: {
    note: "#005a9e",
    warning: "#8a6e00",
    tip: "#008000",
  },
};
