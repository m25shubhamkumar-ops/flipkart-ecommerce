const Address = require('../models/address.model');

exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.render('profile/addresses', {
      title: 'Manage Addresses - Flipkart',
      addresses,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

exports.postCreateAddress = async (req, res, next) => {
  try {
    const { fullName, phone, line1, line2, city, state, pincode, isDefault } = req.body;

    const existingCount = await Address.countDocuments({ userId: req.user._id });
    const shouldBeDefault = Boolean(isDefault) || existingCount === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    }

    await Address.create({
      userId: req.user._id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      line1: line1.trim(),
      line2: line2 ? line2.trim() : '',
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      isDefault: shouldBeDefault
    });

    const redirectUrl = req.body.redirect || '/profile/addresses';
    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

exports.postSetDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    await Address.findOneAndUpdate({ _id: id, userId: req.user._id }, { isDefault: true });
    res.redirect('back');
  } catch (error) {
    next(error);
  }
};

exports.postDeleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Address.findOneAndDelete({ _id: id, userId: req.user._id });
    res.redirect('back');
  } catch (error) {
    next(error);
  }
};
