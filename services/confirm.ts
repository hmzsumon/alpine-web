/* ────────── destructive draft switches always ask before losing unsent items ────────── */
export const Alert = {
  alert(
    title: string,
    message: string,
    buttons: { text: string; style?: string; onPress?: () => void }[],
  ) {
    if (window.confirm(title + "\n" + message))
      buttons.find((b) => b.onPress)?.onPress?.();
  },
};
