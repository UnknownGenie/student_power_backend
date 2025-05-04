import { School } from '../models/index.js';

export const getSchools = async (req, res) => {
  try {
    const schools = await School.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      count: schools.length,
      data: schools
    });
  } catch (error) {
    console.error('Get Schools Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error'
    });
  }
};

export const getSchool = async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id, {
      attributes: ['id', 'name']
    });
    
    if (!school) {
      return res.status(404).json({ 
        success: false, 
        error: 'School not found' 
      });
    }

    return res.status(200).json({
      success: true,
      data: school
    });
  } catch (error) {
    console.error('Get School Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error'
    });
  }
};
