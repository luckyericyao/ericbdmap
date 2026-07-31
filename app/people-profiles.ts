export type PeopleProfile = {
  linkedinUrl?: string;
  avatarUrl?: string;
  verificationStatus:
    | "LinkedIn profile verified"
    | "Current LinkedIn title differs from structure snapshot"
    | "Role changed since structure snapshot"
    | "No confirmed LinkedIn profile";
};

function verified(
  id: string,
  linkedinUrl: string,
  verificationStatus: PeopleProfile["verificationStatus"] =
    "LinkedIn profile verified",
): PeopleProfile {
  return {
    linkedinUrl,
    avatarUrl: `/people/${id}.jpg`,
    verificationStatus,
  };
}

const unresolved: PeopleProfile = {
  verificationStatus: "No confirmed LinkedIn profile",
};

export const peopleProfiles: Record<string, PeopleProfile> = {
  "nvs-vas": verified(
    "nvs-vas",
    "https://www.linkedin.com/in/vasnarasimhan/",
  ),
  "nvs-ronny": verified(
    "nvs-ronny",
    "https://www.linkedin.com/in/ronny-gal-a5b769/",
  ),
  "nvs-susanne": verified(
    "nvs-susanne",
    "https://www.linkedin.com/in/susanne-kreutz-124b54a2/",
  ),
  "nvs-paul": verified(
    "nvs-paul",
    "https://www.linkedin.com/in/pathibodeau/",
  ),
  "nvs-berthold": verified(
    "nvs-berthold",
    "https://www.linkedin.com/in/berthold-hinzen-36993646/",
  ),
  "nvs-tariq": verified(
    "nvs-tariq",
    "https://www.linkedin.com/in/tariq-elrafie-b871409/",
  ),
  "nvs-guillaume": verified(
    "nvs-guillaume",
    "https://www.linkedin.com/in/guillaume-vignon-29178b1/",
  ),
  "nvs-matteo": unresolved,
  "nvs-janet": verified(
    "nvs-janet",
    "https://www.linkedin.com/in/janet-raimondo-13564b43/",
  ),
  "nvs-arne": verified(
    "nvs-arne",
    "https://www.linkedin.com/in/arne-w%C3%B6rn-7789485/",
  ),
  "nvs-arun": verified(
    "nvs-arun",
    "https://www.linkedin.com/in/arunsbisht/",
  ),
  "nvs-kirsten": verified(
    "nvs-kirsten",
    "https://www.linkedin.com/in/kirsten-shivji-49118112/",
  ),

  "amg-rachna": verified(
    "amg-rachna",
    "https://www.linkedin.com/in/rachna-khosla-4236a064/",
  ),
  "amg-jessica": verified(
    "amg-jessica",
    "https://www.linkedin.com/in/jessica-droge-75b380b/",
    "Current LinkedIn title differs from structure snapshot",
  ),
  "amg-janis": verified(
    "amg-janis",
    "https://www.linkedin.com/in/janisnaeve/",
    "Role changed since structure snapshot",
  ),
  "amg-nate": verified(
    "amg-nate",
    "https://www.linkedin.com/in/naterussell/",
  ),
  "amg-rodrigo": verified(
    "amg-rodrigo",
    "https://www.linkedin.com/in/rodrigo-vallejo-45226211/",
  ),
  "amg-chris": unresolved,
  "amg-tara": verified(
    "amg-tara",
    "https://www.linkedin.com/in/tarapabstmarra/",
  ),

  "san-monika": verified(
    "san-monika",
    "https://www.linkedin.com/in/monika-vnuk-6b3408/",
  ),
  "san-david": verified(
    "san-david",
    "https://www.linkedin.com/in/david-hering/",
  ),
  "san-jason": verified(
    "san-jason",
    "https://www.linkedin.com/in/jason-p-hafler-5b81372b/",
  ),
  "san-michael": verified(
    "san-michael",
    "https://www.linkedin.com/in/michaelpalladinetti/",
  ),
  "san-brian": verified(
    "san-brian",
    "https://www.linkedin.com/in/brian-bronk-6a26363/",
  ),
  "san-laurie": verified(
    "san-laurie",
    "https://www.linkedin.com/in/laurie-gery-90746a4/",
  ),
  "san-merlin": verified(
    "san-merlin",
    "https://www.linkedin.com/in/matthieu-merlin-603308/",
  ),
  "san-lebrun": verified(
    "san-lebrun",
    "https://www.linkedin.com/in/matthieu-lebrun-44770315/",
  ),
  "san-catherine": verified(
    "san-catherine",
    "https://www.linkedin.com/in/catherinekrausblanchette/",
  ),
  "san-ying": verified(
    "san-ying",
    "https://www.linkedin.com/in/ying-yang-3a9b3b/",
  ),

  "az-ratan": verified(
    "az-ratan",
    "https://www.linkedin.com/in/ratan-bhat-b34b1ba/",
  ),
  "az-nikhil": verified(
    "az-nikhil",
    "https://www.linkedin.com/in/nikhilmutyal/",
  ),
  "az-josefin": verified(
    "az-josefin",
    "https://www.linkedin.com/in/josefin-tevell/",
  ),
  "az-nathan": verified(
    "az-nathan",
    "https://www.linkedin.com/in/nathan-styles-0a56563/",
  ),
  "az-susanna": verified(
    "az-susanna",
    "https://www.linkedin.com/in/susanna-myhre-10968b66/",
  ),
  "az-christopher": verified(
    "az-christopher",
    "https://www.linkedin.com/in/christopherchurch1/",
  ),
  "az-rodolphe": verified(
    "az-rodolphe",
    "https://www.linkedin.com/in/rodolphegrepinet/",
  ),
  "az-brigitte": verified(
    "az-brigitte",
    "https://www.linkedin.com/in/brigitte-de-lima-phd-cfa-61559715/",
  ),
  "az-thomas": verified(
    "az-thomas",
    "https://www.linkedin.com/in/thomas-debrosse-97516b16/",
  ),
  "az-richard": verified(
    "az-richard",
    "https://www.linkedin.com/in/richard-yuan-30849654/",
  ),
  "az-bing": verified(
    "az-bing",
    "https://www.linkedin.com/in/bing-chen-bb17b4/",
  ),
  "az-peter": unresolved,

  "roc-thomas": verified(
    "roc-thomas",
    "https://www.linkedin.com/in/thomasschinecker/",
  ),
  "roc-boris": verified(
    "roc-boris",
    "https://www.linkedin.com/in/boriszaitra/",
  ),
  "roc-enza": verified(
    "roc-enza",
    "https://www.linkedin.com/in/enza-di-modugno-26b324b/",
  ),
  "roc-jean": verified(
    "roc-jean",
    "https://www.linkedin.com/in/jean-eric-charoin-a6aa7a7/",
  ),
  "roc-qiusong": verified(
    "roc-qiusong",
    "https://www.linkedin.com/in/qstang/",
  ),
  "roc-gregg": unresolved,
  "roc-michael": verified(
    "roc-michael",
    "https://www.linkedin.com/in/michael-scherer-5b66978/",
  ),
  "roc-isaac": verified(
    "roc-isaac",
    "https://www.linkedin.com/in/isaacveinbergs/",
  ),
  "roc-rose": verified(
    "roc-rose",
    "https://www.linkedin.com/in/rosedamestani/",
  ),
  "roc-patrick": verified(
    "roc-patrick",
    "https://www.linkedin.com/in/patrick-schleck-ab951614/",
  ),
  "roc-robert": verified(
    "roc-robert",
    "https://www.linkedin.com/in/robertcwild/",
  ),
  "roc-zineb": verified(
    "roc-zineb",
    "https://www.linkedin.com/in/zineb-el-fajoui-4bb51816/",
  ),
  "roc-barbara": verified(
    "roc-barbara",
    "https://ch.linkedin.com/in/barbara-lueckel-b615067",
  ),
  "roc-tomas": unresolved,
  "roc-matthias": unresolved,
  "roc-ingo": verified(
    "roc-ingo",
    "https://www.linkedin.com/in/ingo-stiller-7720531/",
  ),
  "roc-oliver": verified(
    "roc-oliver",
    "https://www.linkedin.com/in/oliver-froescheis-2370098/",
  ),
  "roc-beth": verified(
    "roc-beth",
    "https://www.linkedin.com/in/beth-odeh-frikert-a2917847/",
  ),
  "roc-harm": verified(
    "roc-harm",
    "https://cn.linkedin.com/in/harm-jan-borgeld-913135",
  ),
  "roc-wenjia": verified(
    "roc-wenjia",
    "https://www.linkedin.com/in/wenjia-li-65227197",
  ),
  "roc-takumi": verified(
    "roc-takumi",
    "https://jp.linkedin.com/in/takumi-matsumoto-8528b7130",
  ),
  "roc-hailey": verified(
    "roc-hailey",
    "https://kr.linkedin.com/in/hailey-jung-%EC%A0%95%ED%9A%8C%EB%9F%89-36894339",
  ),
  "roc-anna": unresolved,

  "pfi-steve": unresolved,
  "pfi-lauren": verified(
    "pfi-lauren",
    "https://www.linkedin.com/in/lauren-shearman-ph-d-3297abb/",
  ),
  "pfi-allison": unresolved,
  "pfi-joel": verified(
    "pfi-joel",
    "https://www.linkedin.com/in/joelklappenbach/",
  ),
  "pfi-giuseppe": verified(
    "pfi-giuseppe",
    "https://www.linkedin.com/in/lofangi/",
  ),
  "pfi-katrina": verified(
    "pfi-katrina",
    "https://www.linkedin.com/in/katrina-loomis-17094811/",
  ),
  "pfi-irena": verified(
    "pfi-irena",
    "https://www.linkedin.com/in/irena-melnikova-b047891/",
  ),

  "bio-chris": verified(
    "bio-chris",
    "https://www.linkedin.com/in/christopher-viehbacher/",
  ),
  "bio-keeney": verified(
    "bio-keeney",
    "https://www.linkedin.com/in/adam-keeney/",
  ),
  "bio-feire": verified(
    "bio-feire",
    "https://www.linkedin.com/in/adam-feire-9666a72/",
  ),

  "boe-scott": verified(
    "boe-scott",
    "https://www.linkedin.com/in/scottdewire/",
  ),
  "boe-lena": unresolved,
};
