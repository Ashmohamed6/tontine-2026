'use client';

import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle, Sparkles, X, AlertCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, remove } from 'firebase/database';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCF6H1XTq9NBUwdJXWSr3PwnAQsi7Ku0kY",
  authDomain: "tontine-2026-6602f.firebaseapp.com",
  databaseURL: "https://tontine-2026-6602f-default-rtdb.firebaseio.com",
  projectId: "tontine-2026-6602f",
  storageBucket: "tontine-2026-6602f.firebasestorage.app",
  messagingSenderId: "232289457305",
  appId: "1:232289457305:web:75ae38fbd2855a61229408"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Icônes de la nature (emojis)
const NATURE_ICONS = ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🦋', '🐝', '🌿', '🍀'];

export default function TontineApp() {
  // ⚠️ CODE PIN DE L'ORGANISATRICE - Changez ce code !
  const ADMIN_PIN = 'Mo&Clau';

  const [showLegal, setShowLegal] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentName, setCurrentName] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [assignedNumber, setAssignedNumber] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [positions, setPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    listenToChanges();
  }, []);

  const listenToChanges = () => {
    const participantsRef = ref(database, 'participants');
    onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setParticipants(Object.values(data));
      } else {
        setParticipants([]);
      }
    });
  };

  const loadData = async () => {
    try {
      const participantsRef = ref(database, 'participants');
      const snapshot = await get(participantsRef);
      
      let currentParticipants = [];
      if (snapshot.exists()) {
        currentParticipants = Object.values(snapshot.val());
      }

      // Inscription automatique de l'organisatrice si pas déjà inscrite
      const organizerExists = currentParticipants.find(p => p.position === 1);
      if (!organizerExists) {
        await saveParticipant({
          name: 'QUENUM Claudelle',
          position: 1
        });
        currentParticipants.push({ name: 'QUENUM Claudelle', position: 1 });
      }

      setParticipants(currentParticipants);
      shufflePositions(currentParticipants);
    } catch (error) {
      console.error('Erreur de chargement:', error);
    }
    setIsLoading(false);
  };

  const saveParticipant = async (participant) => {
    try {
      const participantRef = ref(database, `participants/${participant.position}`);
      await set(participantRef, participant);
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      alert('Erreur de connexion. Veuillez réessayer.');
    }
  };

  const shufflePositions = (currentParticipants) => {
    const nums = Array.from({ length: 10 }, (_, i) => i + 1);
    const shuffled = nums.sort(() => Math.random() - 0.5);
    
    const newPositions = shuffled.map((num, index) => {
      const participant = currentParticipants.find(p => p.position === num);
      return {
        id: index,
        number: num,
        icon: NATURE_ICONS[index],
        taken: !!participant,
        name: participant?.name || null,
        isOrganizer: num === 1
      };
    });
    
    setPositions(newPositions);
  };

  useEffect(() => {
    if (participants.length > 0) {
      shufflePositions(participants);
    }
  }, [participants]);

  const handleIconClick = (position) => {
    if (position.taken) return;
    setSelectedPosition(position);
    setShowNameModal(true);
  };

  const handleNameSubmit = async () => {
    if (!currentName.trim() || !selectedPosition) return;

    const nameExists = participants.some(
      p => p.name.toLowerCase().trim() === currentName.toLowerCase().trim()
    );

    if (nameExists) {
      setShowNameModal(false);
      setErrorMessage(`Le nom "${currentName.trim()}" est déjà inscrit. Veuillez choisir un autre nom ou vérifier votre inscription dans la liste des participants.`);
      setShowErrorModal(true);
      setCurrentName('');
      return;
    }

    const newParticipant = {
      name: currentName.trim(),
      position: selectedPosition.number
    };

    await saveParticipant(newParticipant);
    
    setAssignedNumber(selectedPosition.number);
    setShowNameModal(false);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setCurrentName('');
    setSelectedPosition(null);
    setAssignedNumber(null);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const showResetConfirm = () => {
    setPinInput('');
    setShowPinModal(true);
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setPinInput('');
  };

  const handlePinSubmit = () => {
    if (pinInput === ADMIN_PIN) {
      setShowPinModal(false);
      setPinInput('');
      setShowResetModal(true);
    } else {
      setShowPinModal(false);
      setPinInput('');
      setErrorMessage('Code secret incorrect ! Seule l\'organisatrice peut réinitialiser la tontine.');
      setShowErrorModal(true);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
  };

  const resetAll = async () => {
    try {
      const participantsRef = ref(database, 'participants');
      await remove(participantsRef);
      
      await saveParticipant({
        name: 'QUENUM Claudelle',
        position: 1
      });
      
      setShowResetModal(false);
      
      // Afficher un message de succès
      setErrorMessage('✅ La tontine a été réinitialisée avec succès ! QUENUM Claudelle est inscrite en position N°1.');
      setShowErrorModal(true);
    } catch (error) {
      console.error('Erreur de réinitialisation:', error);
      setErrorMessage('❌ Erreur lors de la réinitialisation. Veuillez réessayer.');
      setShowErrorModal(true);
    }
  };

  const getMonthName = (positionNumber) => {
    const months = [
      'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre'
    ];
    return months[positionNumber - 1];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Chargement...</div>
      </div>
    );
  }

  if (showLegal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <Users className="w-16 h-16 mx-auto text-purple-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Tontine 2026</h1>
            <p className="text-sm text-gray-500">Organisée par QUENUM Claudelle</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-purple-900 mb-4">Mentions Légales & Règlement</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p>📋 <strong>Principe:</strong> Tontine de 10 participants sur 10 mois (Février - Novembre 2026)</p>
              <p>👑 <strong>Organisation:</strong> QUENUM Claudelle - Position N°1 (Responsable)</p>
              <p>💰 <strong>Fonctionnement:</strong> Chaque mois, un participant reçoit la cagnotte collective</p>
              <p>🤝 <strong>Engagement:</strong> En participant, vous vous engagez à verser votre cotisation mensuelle jusqu'à la fin de la tontine</p>
              <p>⚖️ <strong>Responsabilité:</strong> La participation est basée sur la confiance mutuelle entre les membres</p>
              <p>🔒 <strong>Confidentialité:</strong> Les informations sont stockées localement sur votre appareil</p>
            </div>
          </div>

          <button
            onClick={() => setShowLegal(false)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg"
          >
            J&apos;ai lu et j&apos;accepte - Continuer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            <div className="text-center sm:text-left w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Tontine 2026</h1>
              <p className="text-xs sm:text-sm text-gray-500">Organisée par QUENUM Claudelle</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={showResetConfirm}
                className="px-3 py-2 text-xs sm:text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-medium"
                title="Réinitialiser toute la tontine"
              >
                🔄 Réinitialiser
              </button>
              <Calendar className="w-10 h-10 text-purple-600 flex-shrink-0" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-3 sm:p-4">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-700">Participants inscrits:</span>
              <span className="font-bold text-purple-600">{participants.length} / 10</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {participants.length < 10 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Comment participer ?</h2>
            <p className="text-gray-600">
              Cliquez sur une icône disponible pour vous inscrire et découvrir votre position
            </p>
          </div>
        )}

        {/* Grille des positions - SANS numéros visibles */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Choisissez votre icône</h2>
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {positions.map((position) => (
              <button
                key={position.id}
                onClick={() => handleIconClick(position)}
                disabled={position.taken}
                className={`
                  relative p-8 rounded-xl border-2 transition-all duration-300
                  ${position.taken 
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-70' 
                    : 'bg-white border-purple-300 hover:border-purple-500 hover:shadow-lg cursor-pointer hover:scale-105'
                  }
                `}
              >
                <div className="flex flex-col items-center">
                  {position.taken ? (
                    <>
                      <div className="text-6xl mb-2 grayscale opacity-50">
                        {position.icon}
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                    </>
                  ) : (
                    <div className="text-6xl mb-2 animate-pulse">
                      {position.icon}
                    </div>
                  )}
                  
                  {position.taken && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800 mb-1">
                        N°{position.number}
                      </div>
                      <div className="text-xs text-purple-600 font-medium mb-1">
                        {getMonthName(position.number)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium mt-2 break-words">
                        {position.name}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {participants.length === 10 && (
            <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <p className="text-center text-green-700 font-semibold">
                ✅ Tontine complète ! Tous les participants sont inscrits.
              </p>
            </div>
          )}
        </div>

        {/* Liste des participants */}
        {participants.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Liste des participants</h2>
            <div className="space-y-2">
              {[...participants]
                .sort((a, b) => a.position - b.position)
                .map((participant, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      participant.position === 1 ? 'bg-purple-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        participant.position === 1 ? 'bg-purple-600 text-white' : 'bg-purple-200 text-purple-700'
                      }`}>
                        {participant.position}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{participant.name}</div>
                        {participant.position === 1 && (
                          <div className="text-xs text-purple-600">Organisateur(trice)</div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {getMonthName(participant.position)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Pied de page */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Les icônes changent de position à chaque actualisation</p>
          <p className="mt-2">© 2026 - Tontine QUENUM Claudelle</p>
        </div>
      </div>

      {/* Modal de demande du code PIN */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full relative animate-fadeIn">
            <button
              onClick={closePinModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-purple-600 text-4xl sm:text-5xl">🔒</div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Code secret requis</h2>
              <p className="text-sm sm:text-base text-gray-600">
                Entrez le code secret pour réinitialiser la tontine
              </p>
            </div>

            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && pinInput.trim() && handlePinSubmit()}
              placeholder="Code PIN"
              className="w-full px-4 py-3 text-center text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none mb-6 tracking-widest"
              maxLength={20}
              autoFocus
            />

            <button
              onClick={handlePinSubmit}
              disabled={!pinInput.trim()}
              className={`w-full py-3 rounded-xl font-semibold transition-colors text-base sm:text-lg ${
                pinInput.trim()
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Vérifier
            </button>
          </div>
        </div>
      )}

      {/* Modal de saisie du nom */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fadeIn">
            <button
              onClick={() => {
                setShowNameModal(false);
                setCurrentName('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{selectedPosition?.icon}</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Inscription</h2>
              <p className="text-gray-600">Entrez votre nom pour vous inscrire</p>
            </div>

            <input
              type="text"
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="Votre nom complet"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none mb-6"
              maxLength={50}
              autoFocus
            />

            <button
              onClick={handleNameSubmit}
              disabled={!currentName.trim()}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                currentName.trim()
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      {/* Modal d'erreur pour les doublons */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fadeIn">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Nom déjà utilisé</h2>
              <p className="text-gray-600">
                {errorMessage}
              </p>
            </div>

            <button
              onClick={closeErrorModal}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmation avec le numéro */}
      {showConfirmModal && assignedNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fadeIn">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Félicitations !</h2>
              <p className="text-gray-600 mb-4">
                Merci <span className="font-semibold text-purple-600">{currentName}</span> pour votre participation
              </p>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 mb-6">
              <p className="text-gray-700 mb-2">Votre position est :</p>
              <div className="text-5xl font-bold text-purple-600 mb-2">
                N°{assignedNumber}
              </div>
              <div className="text-lg text-purple-700 font-medium">
                {getMonthName(assignedNumber)} 2026
              </div>
              {assignedNumber === 1 && (
                <div className="mt-3 text-sm text-purple-600 font-semibold">
                  🎉 Vous êtes l&apos;Organisateur(trice) !
                </div>
              )}
            </div>

            <button
              onClick={closeConfirmModal}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Parfait !
            </button>
          </div>
        </div>
      )}

      {/* Modal de réinitialisation */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center animate-fadeIn">
            <div className="mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <div className="text-orange-500 text-4xl sm:text-5xl">⚠️</div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Réinitialiser la tontine ?</h2>
              <p className="text-sm sm:text-base text-gray-600 px-2 mb-3">
                Cette action va supprimer <strong>TOUS les participants</strong> (sauf l&apos;organisatrice).
              </p>
              <p className="text-xs sm:text-sm text-red-600 font-medium">
                ⚠️ Cette action est irréversible !
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={resetAll}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 sm:py-3 text-base sm:text-lg rounded-xl transition-colors"
              >
                Oui, tout réinitialiser
              </button>
              <button
                onClick={closeResetModal}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 sm:py-3 text-base sm:text-lg rounded-xl transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}