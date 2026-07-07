import { readonly, ref } from 'vue'

const AD_CONSENT_STORAGE_KEY = 'portfolio-ad-consent'
const ACCEPTED = 'accepted'
const DECLINED = 'declined'

const consentChoice = ref(null)
const advertisingConsent = ref(false)

let initialized = false

function readConsentChoice() {
  if (typeof window === 'undefined') {
    return null
  }

  const storedChoice = window.localStorage.getItem(AD_CONSENT_STORAGE_KEY)

  return storedChoice === ACCEPTED || storedChoice === DECLINED ? storedChoice : null
}

function syncConsentChoice() {
  consentChoice.value = readConsentChoice()
  advertisingConsent.value = consentChoice.value === ACCEPTED
}

function saveConsentChoice(choice) {
  window.localStorage.setItem(AD_CONSENT_STORAGE_KEY, choice)
  syncConsentChoice()
  window.dispatchEvent(new CustomEvent('portfolio-ad-consent-change', { detail: choice }))
}

export function useAdConsent() {
  if (!initialized && typeof window !== 'undefined') {
    syncConsentChoice()
    window.addEventListener('storage', syncConsentChoice)
    initialized = true
  }

  function acceptAdvertising() {
    saveConsentChoice(ACCEPTED)
  }

  function declineAdvertising() {
    saveConsentChoice(DECLINED)
  }

  function resetAdvertisingConsent() {
    window.localStorage.removeItem(AD_CONSENT_STORAGE_KEY)
    syncConsentChoice()
    window.dispatchEvent(new CustomEvent('portfolio-ad-consent-change', { detail: null }))
  }

  return {
    advertisingConsent: readonly(advertisingConsent),
    consentChoice: readonly(consentChoice),
    acceptAdvertising,
    declineAdvertising,
    resetAdvertisingConsent,
  }
}
