// ─── DEFINICIÓN DE ARMAS ───
// Arreglo con todas las armas disponibles en el juego.
// Cada arma tiene estadísticas completas: cadencia, daño, velocidad de proyectil,
// capacidad del cargador, munición total, tiempo de recarga, tipo de disparo,
// dispersión, color de la bala, cantidad de perdigones y sacudida de cámara.
const WEAPONS = [
  {
    name: 'PISTOL', index: 0,                // Pistola básica: arma inicial del jugador
    fireRate: 0.4, damage: 35, speed: 900,    // Disparo cada 0.4s, 35 de daño, proyectil a 900 px/s
    magSize: 12, totalAmmo: 60,               // 12 balas por cargador, 60 de reserva máxima
    reloadTime: 1.4,                           // Tiempo de recarga en segundos
    auto: false,                               // false = semiautomática (un disparo por clic)
    spread: 0, bulletW: 4, bulletH: 2, bulletColor: '#f0c040', pellets: 1, shake: 0, // Sin dispersión ni sacudida
  },
  {
    name: 'AK-47', index: 1,                  // Rifle de asalto automático
    fireRate: 0.08, damage: 22, speed: 1200,  // Cadencia muy alta, daño moderado por bala
    magSize: 30, totalAmmo: 300,               // Cargador de 30 balas, 300 en reserva
    reloadTime: 2.2,                           // Recarga lenta (2.2s)
    auto: true,                                // true = automático (dispara mientras se sostiene el clic)
    spread: 0.035, bulletW: 6, bulletH: 3, bulletColor: '#d0a030', pellets: 1, shake: 1.5, // Pequeña dispersión, sacudida media
  },
  {
    name: 'SHOTGUN', index: 2,                // Escopeta: dispara múltiples perdigones en abanico
    fireRate: 0.55, damage: 18, speed: 900,    // Cadencia baja, daño individual por perdigón
    magSize: 6, totalAmmo: 30,                 // Solo 6 cartuchos por carga, 30 de reserva
    reloadTime: 1.8,
    auto: false,
    spread: 0.25, bulletW: 4, bulletH: 2, bulletColor: '#ff8844', pellets: 5, shake: 2, // Alta dispersión, 5 perdigones, mucha sacudida
  },
  {
    name: 'DUAL PISTOLS', index: 3,           // Pistolas dobles: dispara dos balas por vez
    fireRate: 0.2, damage: 30, speed: 900,    // Cadencia media, buen daño
    magSize: 24, totalAmmo: 96,               // 24 balas totales (12 por pistola)
    reloadTime: 1.4,
    auto: false,
    spread: 0.06, bulletW: 4, bulletH: 2, bulletColor: '#f0c040', pellets: 2, shake: 0.3, // Dispara 2 proyectiles, poca sacudida
  },
  {
    name: 'MACHINE GUN', index: 4,            // Ametralladora: la mayor cadencia de fuego
    fireRate: 0.05, damage: 18, speed: 1100,  // Disparo cada 0.05s, daño bajo por bala
    magSize: 50, totalAmmo: 400,               // Cargador de 50 balas, 400 en reserva
    reloadTime: 2.5,                           // Recarga muy lenta (2.5s)
    auto: true,
    spread: 0.07, bulletW: 4, bulletH: 2, bulletColor: '#ff6644', pellets: 1, shake: 1.5, // Dispersión media-alta
  },
];
// Índices de las armas disponibles en la caja misteriosa (Mystery Box).
// Se excluye la pistola (índice 0) porque el jugador ya la tiene al inicio.
// Orden de aparición: Escopeta(2), Pistolas Dobles(3), AK-47(1), Ametralladora(4)
const MYSTERY_WEAPON_INDICES = [2, 3, 1, 4];
