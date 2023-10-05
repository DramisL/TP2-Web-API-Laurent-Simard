import Model from './model.js';

export default class Math extends Model {
    constructor() {
        super();

        this.addField('op', 'string');
        this.addField('x', 'float');
        this.addField('y', 'float');
        this.addField('n', 'integer');
        this.addField('value', 'string');
              
        this.setKey("Title");
    }
}