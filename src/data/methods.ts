import type { DiscoveryMethod } from "@/domain/exoplanets/model";

export type TaughtMethod = Extract<
    DiscoveryMethod,
    "transit" | "vitesse-radiale" | "imagerie-directe" | "microlentille" | "astrometrie" | "variation-temps-transit"
>;

export interface DetectionMethod {
    method: TaughtMethod;
    summary: string;
    details: string;
    strengths: readonly string[];
    limits: readonly string[];
    examples: readonly string[];
}

export const detectionMethods: readonly DetectionMethod[] = [
    {
        method: "transit",
        summary: "Lorsqu'une planète passe devant son étoile, elle en masque une infime partie. La baisse de luminosité, répétée à chaque orbite, trahit sa présence.",
        details: "La profondeur du transit donne le rayon de la planète par rapport à celui de l'étoile, et l'intervalle entre deux transits donne la période orbitale. Les missions Kepler et TESS ont découvert ainsi la majorité des exoplanètes connues.",
        strengths: [
            "Mesure le rayon de la planète.",
            "Permet d'étudier l'atmosphère par spectroscopie de transmission.",
            "Se prête aux grands relevés photométriques automatisés."
        ],
        limits: [
            "Ne fonctionne que si l'orbite est vue presque par la tranche.",
            "Favorise les planètes proches de leur étoile, aux transits fréquents.",
            "Une étoile double à éclipses peut imiter un transit : une confirmation est nécessaire."
        ],
        examples: ["trappist-1-e", "kepler-186-f", "k2-18-b"]
    },
    {
        method: "vitesse-radiale",
        summary: "Une planète et son étoile tournent autour de leur centre de masse commun. L'étoile oscille légèrement, ce qui décale périodiquement les raies de son spectre par effet Doppler.",
        details: "L'amplitude de l'oscillation donne une masse minimale, notée M sin i, car l'inclinaison de l'orbite reste généralement inconnue. C'est cette méthode qui a révélé 51 Pegasi b en 1995.",
        strengths: [
            "Donne une estimation de la masse, au moins minimale.",
            "Fonctionne pour la plupart des inclinaisons d'orbite.",
            "Combinée au transit, permet de calculer la densité."
        ],
        limits: [
            "Ne fournit qu'une masse minimale sans connaître l'inclinaison.",
            "Favorise les planètes massives et proches de leur étoile.",
            "L'activité de l'étoile, comme les taches, peut imiter un signal."
        ],
        examples: ["51-peg-b", "proxima-cen-b", "55-cnc-e"]
    },
    {
        method: "imagerie-directe",
        summary: "Il s'agit de photographier la planète elle-même en masquant la lumière de son étoile, souvent des millions de fois plus brillante.",
        details: "Coronographes, optique adaptative et traitement d'image isolent la faible lueur infrarouge de jeunes planètes géantes, encore chaudes et éloignées de leur étoile.",
        strengths: [
            "Recueille directement la lumière de la planète.",
            "Permet d'analyser son atmosphère et de suivre son orbite.",
            "Accède aux orbites larges, difficiles à sonder autrement."
        ],
        limits: [
            "Limitée aux planètes jeunes, massives et éloignées de leur étoile.",
            "La masse dépend de modèles d'évolution, donc incertaine.",
            "Exige les plus grands télescopes et des instruments spécialisés."
        ],
        examples: ["hr-8799-b", "bet-pic-b", "51-eri-b"]
    },
    {
        method: "microlentille",
        summary: "Quand une étoile passe devant une étoile plus lointaine, sa gravité agit comme une lentille et amplifie temporairement la lumière de l'arrière-plan. Une planète autour de l'étoile-lentille ajoute une brève anomalie.",
        details: "L'alignement ne se produit qu'une fois, et la signature planétaire dure de quelques heures à quelques jours. La méthode révèle des planètes froides, éloignées de leur étoile, jusqu'à des milliers d'années-lumière.",
        strengths: [
            "Sensible aux planètes de faible masse sur des orbites larges.",
            "Détecte des systèmes très lointains, vers le centre de la Galaxie.",
            "Ne dépend pas de la lumière émise par l'étoile hôte."
        ],
        limits: [
            "Événement unique, impossible à reproduire.",
            "Distance et masse de l'étoile souvent mal contraintes.",
            "Suivi ultérieur de la planète généralement impossible."
        ],
        examples: ["ogle-2005-blg-390l-b", "ogle-2006-blg-109l-b", "moa-2007-blg-192l-b"]
    },
    {
        method: "astrometrie",
        summary: "Au lieu de mesurer la vitesse de l'étoile, l'astrométrie suit sa position sur le ciel : une planète massive lui fait décrire une minuscule ellipse.",
        details: "Le déplacement à mesurer est infime, de l'ordre du millième de seconde d'arc ou moins. La mission Gaia de l'Agence spatiale européenne rend ces mesures possibles pour un grand nombre d'étoiles.",
        strengths: [
            "Donne la masse réelle et l'inclinaison de l'orbite.",
            "Sensible aux planètes massives sur des orbites larges.",
            "Complète les mesures de vitesse radiale."
        ],
        limits: [
            "Exige une précision de position extrême.",
            "Très peu de découvertes à ce jour.",
            "Demande plusieurs années d'observation pour couvrir l'orbite."
        ],
        examples: ["gj-896-a-b", "denis-p-j082303-1-491201-b", "gaia-4-b"]
    },
    {
        method: "variation-temps-transit",
        summary: "Dans un système à plusieurs planètes, les attractions mutuelles avancent ou retardent légèrement les transits. Mesurer ces écarts révèle d'autres planètes, parfois invisibles en transit.",
        details: "Les écarts, de quelques minutes à quelques heures, permettent aussi d'estimer la masse des planètes sans recourir à la vitesse radiale. Kepler-19 c compte parmi les premières planètes découvertes ainsi, en 2011.",
        strengths: [
            "Révèle des planètes qui ne passent pas devant leur étoile.",
            "Estime des masses à partir de la seule photométrie.",
            "Renseigne sur l'architecture des systèmes multiples."
        ],
        limits: [
            "Nécessite au moins une planète en transit dans le système.",
            "Efficace surtout près des résonances orbitales.",
            "Plusieurs configurations peuvent expliquer les mêmes écarts."
        ],
        examples: ["kepler-19-c", "kepler-46-c", "kepler-138-e"]
    }
];
