const Address = require('../models/address.model');

exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.render('profile/addresses', {
      title: 'Manage Addresses - Flipkart',
      addresses,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (error) {
    next(error);
  }
};

exports.postCreateAddress = async (req, res, next) => {
  try {
    const { fullName, phone, line1, line2, city, state, pincode, isDefault } = req.body;

    const cleanPincode = pincode ? pincode.trim() : '';
    if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
      const target = req.body.redirect || '/profile/addresses';
      const sep = target.includes('?') ? '&' : '?';
      return res.redirect(target + sep + 'error=' + encodeURIComponent('Please enter a valid 6-digit Indian PIN code (e.g. 560001, 110001).'));
    }

    if (!fullName || !phone || !line1 || !city || !state) {
      const target = req.body.redirect || '/profile/addresses';
      const sep = target.includes('?') ? '&' : '?';
      return res.redirect(target + sep + 'error=' + encodeURIComponent('Please fill in all required address fields.'));
    }

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
      pincode: cleanPincode,
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
