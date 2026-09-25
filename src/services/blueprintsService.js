import apiclient from './blueprints/apiclient.js'
import apimock from './blueprints/apimock.js'

// Conmutación con una sola línea: VITE_USE_MOCK=true -> mock, false -> API real.
export const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

const blueprintsService = isMockMode ? apimock : apiclient

export default blueprintsService
