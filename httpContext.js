/////////////////////////////////////////////////////////////////////
// This module define the HttpContext class
// When the server receive a http request an instance of the 
// HttpContext is created and will hold all information of the
// request also the payload if the verb is GET or PUT
/////////////////////////////////////////////////////////////////////
// Author : Nicolas Chourot
// Lionel-Groulx College
/////////////////////////////////////////////////////////////////////
import queryString from "query-string";
import Response from "./response.js";
import * as utilities from "./utilities.js";
import * as Math from "mathjs";

let httpContext = null;
//Todo: Trouver le moyen d'appliquer les check de type de la classe model sur les valeur de path.params
export default class HttpContext {
    constructor(req, res) {
        this.req = req;
        this.res = res;
        this.path = utilities.decomposePath(req.url);
        this.response = new Response(res);
        this.payload = null;
        this.secure = req.headers['x-forwarded-proto'] != undefined;
        this.host = (this.secure ? "https://" : "http://") + req.headers["host"];
        this.hostIp = req.headers['x-forwarded-for'] != undefined ? req.headers['x-forwarded-for'] : "127.0.0.1";
    }
    static get() {
        return httpContext;
    }
    async getJSONPayload() {
        return await new Promise(resolve => {
            let body = [];
            this.req.on('data', chunk => {
                body += chunk; // body.push(chunk) was a mistake and do not work with big data
            }).on('end', () => {
                if (body.length > 0) {
                    if (this.req.headers['content-type'] == "application/json") {
                        try {
                            this.payload = JSON.parse(body);
                        }
                        catch (error) {
                            console.log(error);
                            this.payload = null;
                        }
                    } else {
                        if (this.req.headers["content-type"] === "application/x-www-form-urlencoded") {
                            try { this.payload = queryString.parse(body.toString()); }
                            catch (error) { console.log(error); }
                        }
                    }
                } else {
                    try { this.payload = queryString.parse(utilities.getQueryString(this.req.url)); }
                    catch (error) { console.log(error); }
                }
                if (this.payload != null) {
                    if (Object.keys(this.payload).length == 0)
                        this.payload = null;
                }
                resolve(this.payload);
            });
        })
    }
    ReturnMathResult() {
        let newParams = {};
        for (const [key, value] of Object.entries(this.path.params)) {
            let newKey = key.toLowerCase();
            if (newKey == "op" || newKey == "x" || newKey == "y" || newKey == "n" || newKey == "error") {
                newParams[newKey] = value;
            }else{
                if ("error" in this.path.params === false){
                    newParams["error"] = `Les paramètres ${newKey}`
                } else {
                    newParams["error"] += `, ${newKey}` 
                } 
            }
        }

        if ("error" in newParams === true){
            newParams["error"] += " sont superflux et n'ont pas été pris en compte. " 
        }

        this.path.params = newParams;

        if (this.path.params["op"] == " ") {
            this.path.params["op"] = "+";

            let somme = parseFloat(this.path.params["x"]) + parseFloat(this.path.params["y"]);

            this.path.params["value"] = somme;
        } else if (this.path.params["op"] == "-") {
            let diff = parseFloat(this.path.params["x"]) - parseFloat(this.path.params["y"]);

            this.path.params["value"] = diff;
        } else if (this.path.params["op"] == "*") {
            let produit = parseFloat(this.path.params["x"]) * parseFloat(this.path.params["y"]);

            this.path.params["value"] = produit;
        } else if (this.path.params["op"] == "/") {

            if (this.path.params["y"] <= 0) {
                if (this.path.params["x"] <= 0) {
                    this.path.params["value"] = "NaN";
                }
                else {
                    this.path.params["value"] = "Infinity";
                }
            }
            else {
                let quotient = parseFloat(this.path.params["x"]) / parseFloat(this.path.params["y"]);
                this.path.params["value"] = quotient;
            }

        } else if (this.path.params["op"] == "%") {
            if (this.path.params["y"] <= 0) {
                this.path.params["value"] = "NaN";
            } else {
                let modulo = parseFloat(this.path.params["x"]) % parseFloat(this.path.params["y"]);
                this.path.params["value"] = modulo;
            }
        } else if (this.path.params["op"] == "!") {
            if (this.path.params["n"] < 1 || this.path.params["n"] % 1 != 0) {
                this.path.params["error"] = "Erreur: la valeur de 'n' n'est pas valide";
            } else {
                let counter = 1;
                let factorielle = 1;
                while (counter <= this.path.params["n"]) {
                    factorielle = factorielle * counter;
                    counter++;
                }
                this.path.params["value"] = parseInt(factorielle);
            }

        } else if (this.path.params["op"] == "p") {
            if (parseFloat(this.path.params["n"]) % 1 == 0 && parseFloat(this.path.params["n"]) != 0) {
                this.path.params["value"] = this.isPrime(parseFloat(this.path.params["n"]));
            } else {
                this.path.params["error"] = "Le paramètre 'n' n'accepte que des nombres entiers avec cette opération";
            }

        } else if (this.path.params["op"] == "np") {
            if (parseFloat(this.path.params["n"]) % 1 == 0 && parseFloat(this.path.params["n"]) != 0) {
                this.path.params["value"] = this.findPrime(parseFloat(this.path.params["n"]));
            } else {
                this.path.params["error"] = "Le paramètre 'n' n'accepte que des nombres entiers avec cette opération";
            }
        } else {
            this.path.params["error"] += "L'opération entrée n'existe pas!"
        }
        return true;
    }
    isPrime(value) {
        for (var i = 2; i < value; i++) {
            if (value % i === 0) {
                return false;
            }
        }
        return value > 1;
    }
    findPrime(n) {
        let primeNumer = 0;
        for (let i = 0; i < n; i++) {
            primeNumer++;
            while (!this.isPrime(primeNumer)) {
                primeNumer++;
            }
        }
        return primeNumer;
    }
    static async create(req, res) {
        httpContext = new HttpContext(req, res);
        await httpContext.getJSONPayload();
        return httpContext;
    }
}