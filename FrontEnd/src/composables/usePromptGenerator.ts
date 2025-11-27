import type { FormData } from '@/types'

export function usePromptGenerator() {
    const formatGuestText = (guests: number): string => {
        return guests === 1 ? '1 adult' : `${guests} adults`
    }

    const formatBudgetText = (budget: number): string => {
        return `a budget of ${budget}€`
    }

    const formatExtraInfoText = (extraInfo: string): string => {
        return extraInfo.trim() ? `. Extra info: ${extraInfo.trim()}` : ''
    }

    const generatePrompt = (formData: FormData): string => {
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

        const guestText = formatGuestText(guests)
        const budgetText = formatBudgetText(budget)
        const extraInfoText = formatExtraInfoText(extraInfo)

        if (activeTab === 'hotel') {
            return `I want to book a hotel in ${destination} from ${dateRangeData.startDate} to ${dateRangeData.endDate} for ${guestText} with ${budgetText}${extraInfoText}`
        }

        if (activeTab === 'flights') {
            if (flightDateType === 'single') {
                return `I want to book a one-way flight from ${origin} to ${destination} on ${singleFlightDate} for ${guestText} with ${budgetText}${extraInfoText}`
            } else {
                return `I want to book a round-trip flight from ${origin} to ${destination} from ${dateRangeData.startDate} to ${dateRangeData.endDate} for ${guestText} with ${budgetText}${extraInfoText}`
            }
        }

        return `I want to book a hotel and flight from ${origin} to ${destination} from ${dateRangeData.startDate} to ${dateRangeData.endDate} for ${guestText} with ${budgetText}${extraInfoText}`
    }

    return {
        generatePrompt
    }
}
