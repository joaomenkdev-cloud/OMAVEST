// Alert que funciona também no navegador (o Alert do React Native Web não mostra nada)
import { Alert as RNAlert, Platform } from 'react-native';

export const Alert = {
  alert(titulo, mensagem, botoes) {
    if (Platform.OS !== 'web') return RNAlert.alert(titulo, mensagem, botoes);
    const texto = mensagem ? `${titulo}\n\n${mensagem}` : titulo;
    if (botoes && botoes.length > 1) {
      const ok = botoes.find((b) => b.style !== 'cancel');
      if (window.confirm(texto) && ok?.onPress) ok.onPress();
    } else {
      window.alert(texto);
      botoes?.[0]?.onPress?.();
    }
  },
};
