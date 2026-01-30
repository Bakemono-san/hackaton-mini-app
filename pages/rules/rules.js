Page({
  data: {
    title: "Règles du Jeu",
    description: "Jeu des 12 Pions Sénégalais 🇸🇳",
    sections: [
      {
        heading: "Le Plateau",
        content: [
          "Le jeu se joue sur un plateau 5×5 (25 cases).",
          "Toutes les cases sont actives et jouables."
        ]
      },
      {
        heading: "Les Pions",
        content: [
          "Chaque joueur possède 12 pions :",
          "Joueur 1 : Vert ⬤",
          "Joueur 2 : Rouge ⬤"
        ]
      },
      {
        heading: "Placement Initial",
        content: [
          "Chaque joueur occupe 2 rangées complètes de son côté.",
          "Les 2 lignes centrales sont vides au début de la partie."
        ]
      },
      {
        heading: "Déplacements",
        subSections: [
          {
            title: "Pions normaux ⬤",
            items: [
              "Se déplacent d'une seule case",
              "Directions : avant, gauche, droite",
              "Interdits : arrière et diagonale"
            ]
          },
          {
            title: "Dame 👑",
            items: [
              "Se déplace sur plusieurs cases",
              "Directions : avant, arrière, gauche, droite",
              "Interdit : diagonale"
            ]
          }
        ]
      },
      {
        heading: "Capture",
        subSections: [
          {
            title: "Pions normaux ⬤",
            items: [
              "Capture facultative",
              "Capture horizontale ou verticale uniquement"
            ]
          },
          {
            title: "Dame 👑",
            items: [
              "Capture sur plusieurs cases",
              "Prises multiples autorisées",
              "Captures non obligatoires"
            ]
          }
        ]
      },
      {
        heading: "⚠️ Règle Spéciale : SUR PLACE",
        content: [
          "Si un joueur avait une capture possible mais joue autre chose :",
          "L'adversaire appuie sur le bouton SUR PLACE",
          "Le coup est annulé",
          "Le pion fautif est retiré"
        ]
      },
      {
        heading: "⭐ Promotion en Dame",
        content: [
          "Un pion devient Dame 👑 s'il atteint la dernière rangée adverse",
          "OU s'il ne reste qu'un seul pion au joueur",
          "Promotion immédiate avec animation (halo jaune)"
        ]
      },
      {
        heading: "🏁 Fin de Partie",
        content: [
          "Un joueur n'a plus de pions",
          "Un joueur n'a plus de coups légaux",
          "Un joueur abandonne"
        ]
      }
    ]
  }
})
