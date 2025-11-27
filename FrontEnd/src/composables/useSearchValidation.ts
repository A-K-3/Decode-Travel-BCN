import { reactive } from 'vue'
import { BUDGET_CONFIG, ERROR_MESSAGES, GUESTS_CONFIG, VALIDATION_RULES } from '@/constants/search'
import type { ValidationErrors, FormData } from '@/types'

export function useSearchValidation() {
    const errors = reactive<ValidationErrors>({
        origin: '',
        destination: '',
        dates: '',
        budget: '',
        guests: '',
        extraInfo: ''
    })

    const clearErrors = (): void => {
        errors.origin = ''
        errors.destination = ''
        errors.dates = ''
        errors.budget = ''
        errors.guests = ''
        errors.extraInfo = ''
    }

    const clearError = (field: keyof ValidationErrors): void => {
        if (field in errors) {
            errors[field] = ''
        }
    }

    /**
     * Parse a date string in dd/MM/yyyy format
     */
    const parseDateString = (dateStr: string | null): Date | null => {
        if (!dateStr) return null
        const parts = dateStr.split('/')
        if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
        }
        return new Date(dateStr)
    }

    const validateForm = (formData: FormData): boolean => {
        clearErrors()
        let isValid = true
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const {
            activeTab,
            origin,
            destination,
            flightDateType,
            singleFlightDate,
            dateRangeData,
            budget,
            guests,
            extraInfo
        } = formData

        // Origin validation (only for flights and hotel+flights)
        if (activeTab !== 'hotel') {
            if (!origin.trim()) {
                errors.origin = ERROR_MESSAGES.origin.required
                isValid = false
            } else if (origin.trim().length < VALIDATION_RULES.minLocationChars) {
                errors.origin = ERROR_MESSAGES.origin.minLength
                isValid = false
            }
        }

        // Destination validation
        if (!destination.trim()) {
            errors.destination = ERROR_MESSAGES.destination.required
            isValid = false
        } else if (destination.trim().length < VALIDATION_RULES.minLocationChars) {
            errors.destination = ERROR_MESSAGES.destination.minLength
            isValid = false
        }

        // Date validation
        if (activeTab === 'flights' && flightDateType === 'single') {
            if (!singleFlightDate) {
                errors.dates = ERROR_MESSAGES.dates.flightRequired
                isValid = false
            } else {
                const flightDate = parseDateString(singleFlightDate)
                if (flightDate && flightDate < today) {
                    errors.dates = ERROR_MESSAGES.dates.flightPastDate
                    isValid = false
                }
            }
        } else {
            if (!dateRangeData.startDate || !dateRangeData.endDate) {
                errors.dates = ERROR_MESSAGES.dates.required
                isValid = false
            } else {
                const startDate = parseDateString(dateRangeData.startDate)
                if (startDate && startDate < today) {
                    errors.dates = ERROR_MESSAGES.dates.pastDate
                    isValid = false
                } else if (!dateRangeData.nights || dateRangeData.nights < VALIDATION_RULES.minNights) {
                    errors.dates = ERROR_MESSAGES.dates.minNights
                    isValid = false
                } else if (dateRangeData.nights > VALIDATION_RULES.maxNights) {
                    errors.dates = ERROR_MESSAGES.dates.maxNights
                    isValid = false
                }
            }
        }

        // Budget validation
        if (budget < BUDGET_CONFIG.min || budget > BUDGET_CONFIG.max) {
            errors.budget = `Budget must be between ${BUDGET_CONFIG.min} and ${BUDGET_CONFIG.max}`
            isValid = false
        }

        // Guests validation
        if (!guests || guests < GUESTS_CONFIG.min) {
            errors.guests = ERROR_MESSAGES.guests.required
            isValid = false
        } else if (guests > GUESTS_CONFIG.max) {
            errors.guests = ERROR_MESSAGES.guests.max
            isValid = false
        }

        // Extra info validation (optional but max characters)
        if (extraInfo.length > VALIDATION_RULES.maxExtraInfoChars) {
            errors.extraInfo = `Maximum ${VALIDATION_RULES.maxExtraInfoChars} characters allowed`
            isValid = false
        }

        return isValid
    }

    return {
        errors,
        clearErrors,
        clearError,
        validateForm
    }
}