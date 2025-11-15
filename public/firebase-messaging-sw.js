/**
 * Service Worker para Firebase Cloud Messaging
 * Este arquivo lida com notificações push em segundo plano
 */

// Importa os scripts do Firebase
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuração do Firebase
// IMPORTANTE: Essas variáveis devem ser as mesmas do .env.local
const firebaseConfig = {
  apiKey: "AIzaSyBTpbRWSWSskTMwOmdwhCgqiodkMuDgDyA",
  authDomain: "agendamento-muca.firebaseapp.com",
  projectId: "agendamento-muca",
  storageBucket: "agendamento-muca.firebasestorage.app",
  messagingSenderId: "1089702775407",
  appId: "1:1089702775407:web:fdd6804c08069624f31b9a"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Inicializa o Messaging
const messaging = firebase.messaging();

// Lida com mensagens em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Mensagem recebida em segundo plano:', payload);

  const notificationTitle = payload.notification?.title || 'Nova notificação';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: payload.data?.tag || 'notification',
    data: payload.data,
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Lida com cliques na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Clique na notificação:', event);

  event.notification.close();

  // Abre ou foca a aplicação quando a notificação for clicada
  const urlToOpen = event.notification.data?.link || '/admin';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Se já existe uma janela aberta, foca nela
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // Caso contrário, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
