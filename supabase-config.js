// supabase-config.js
// Configuration Supabase pour mgs-app

// ⚠️ REMPLACEZ CES VALEURS avec vos vraies clés !
const SUPABASE_URL = 'https://karifadoumbouya004-aty.supabase.co';
const SUPABASE_ANON_KEY = 'su_publisheable_vPKVfw5pAD7B7WN_J76UA_60RVx';

// Initialisation du client Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variable pour suivre l'utilisateur connecté
let currentUser = null;

// Fonction pour vérifier si quelqu'un est connecté
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    
    // Mettre à jour les boutons de connexion
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    
    if (loginBtn && logoutBtn && userInfo) {
        if (user) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            userInfo.textContent = `Connecté: ${user.email}`;
        } else {
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            userInfo.textContent = 'Non connecté';
        }
    }
}

// Vérifier au chargement de la page
checkUser();

// Écouter les changements de connexion
supabase.auth.onAuthStateChange(() => {
    checkUser();
});