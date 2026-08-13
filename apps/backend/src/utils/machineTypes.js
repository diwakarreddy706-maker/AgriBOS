export const HARVESTER_TYPES = ['HARVESTER', 'COMBINE_HARVESTER'];
export const TRACTOR_TYPES = ['TRACTOR', 'ROTAVATOR', 'BALER', 'IMPLEMENT'];

export const isHarvesterType = (type) => {
  if (!type) return false;
  return HARVESTER_TYPES.includes(type.toString().toUpperCase());
};

export const isTractorType = (type) => {
  if (!type) return false;
  return TRACTOR_TYPES.includes(type.toString().toUpperCase());
};

export const areTypesCompatible = (bookingType, machineType) => {
  if (!bookingType || !machineType) return true;
  const isBHarv = isHarvesterType(bookingType);
  const isMHarv = isHarvesterType(machineType);
  const isBTrac = isTractorType(bookingType);
  const isMTrac = isTractorType(machineType);

  if (isBHarv && !isMHarv) return false;
  if (isBTrac && !isMTrac) return false;
  return true;
};
