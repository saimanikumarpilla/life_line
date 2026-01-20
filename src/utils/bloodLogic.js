export const isEligibleCheck = (lastDonationDate) => {
    if (!lastDonationDate) return true;
    const lastDate = new Date(lastDonationDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 90; // Approx 3 months
};

export const findMatchingDonors = (requestBloodGroup, donorsList) => {
    return donorsList.filter(donor => {
        return donor.bloodGroup === requestBloodGroup && isEligibleCheck(donor.lastDonationDate);
    });
};

export const sendNotification = async (donorId) => {
    console.log(`Sending notification to donor ${donorId}`);
    // In a real app, this would trigger a Firebase Cloud Function or push notification
    return true;
};
