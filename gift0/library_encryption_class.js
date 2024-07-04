import { GET_text_from_file_wo_auth_GitHub_RESTAPI, GET_fileDownloadUrl_and_sha, decode_desalt, PUT_create_a_file_RESTAPI, PUT_add_to_a_file_RESTAPI, rand_perm } from "./library_to_run_GitHub_Actions.js";

// ------------------------------------------------

// Encrypted Create, Read, Update, Delete file storage
export class encrypted_CRUD_file_storage {

	constructor(RepoAobj) {
		this.RepoAobj = RepoAobj;
	}

	// ------------------------------------------------

	
	// ------------------------------------------------
	// HIGHER-LEVEL PROCESS FUNCTIONS
	// ------------------------------------------------
	async initialize_github() {
		var obj_env = await GET_text_from_file_wo_auth_GitHub_RESTAPI(".env", ".github", this.RepoAobj.repoB_name, this.RepoAobj.repoOwner);
		
		var obj = {env_text: obj_env.text.replace(/[\n\s]/g, ""), 
			   env_file_download_url: obj_env.file_download_url, 
			   env_sha: obj_env.sha, 
			   n: 1,
			   repoOwner: this.RepoAobj.repoOwner,
			   filename: this.RepoAobj.filename, 
			   foldername: this.RepoAobj.foldername, 
			   input_text: this.RepoAobj.input_text, 
			   repoB_name: this.RepoAobj.repoB_name,
			   type_of_encryption: this.RepoAobj.type_of_encryption,
			   append_text: this.RepoAobj.append_text,
		};
	
		Object.freeze(obj.env_text); // make the original value non-changeable

		return obj;
	}

	// ------------------------------------------------

	async initialize_window_crypto_subtle(obj) {
		
		var obj_public = await GET_text_from_file_wo_auth_GitHub_RESTAPI(".public_window_crypto_subtle", ".github", this.RepoAobj.repoB_name, this.RepoAobj.repoOwner);
		var obj_private = await GET_text_from_file_wo_auth_GitHub_RESTAPI(".private_window_crypto_subtle", ".github", this.RepoAobj.repoB_name, this.RepoAobj.repoOwner);
		
		obj.public_text = obj_public.text.replace(/[\n\s]/g, "");
		obj.public_file_download_url = obj_public.file_download_url;
		obj.public_sha = obj_public.sha;
		obj.private_text = obj_private.text.replace(/[\n\s]/g, "");
		obj.private_file_download_url = obj_private.file_download_url;
		obj.private_sha = obj_private.sha;
			
		Object.freeze(obj.public_text); // make the original value non-changeable
		Object.freeze(obj.private_text); // make the original value non-changeable

		return obj;
	}

	// ------------------------------------------------

	async search_file_contents() {
		
		var obj = await this.initialize_github();
		
		// ------------------------------------------------

		if (obj.type_of_encryption == "window_crypto_subtle") {
			// Step 0: convert the JSON Web key (Key_jwk_obj) to an object (Key_obj)
			obj = await this.initialize_window_crypto_subtle(obj);
			obj = await this.GET_public_private_keys(obj);
		}
		
		// ------------------------------------------------
	
		// Step 1: decrypt the file
		obj = await this.decrypt_file(obj);
		
	       	// --------------------------------
	
		// Step 2: Perform query 0 - Determine if the text_input is in the file_contents
		console.log('****** Step 2: Perform query 0 - Determine if the text_input is in the file_contents ******');
		
		// Obtain username
		obj.username = obj.input_text.split('|').shift();
		// console.log("obj.username:", obj.username);
	
		// [Query 0] Determine if username is in the database
		obj.query_search_result = await this.comparator_search_for_a_username(obj.decrypted_file_contents, obj.username);
		delete obj.decrypted_file_contents;
		return obj;
	}

	// ------------------------------------------------

	async add_data_to_file() {
	
		var obj = await this.initialize_github();
		
		// ------------------------------------------------

		if (obj.type_of_encryption == "window_crypto_subtle") {
			// Step 0: convert the JSON Web key (Key_jwk_obj) to an object (Key_obj)
			obj = await this.initialize_window_crypto_subtle(obj);
			obj = await this.GET_public_private_keys(obj);
		}
		
		// ------------------------------------------------
	
		// Obtain input_text
		obj.input_text_only = obj.input_text.split('|').shift();
		// console.log("obj.input_text_only:", obj.input_text_only);

		// ------------------------------------------------

		// Ways to add data to a file: 0. append unique data to exsiting data ("append_unique"), 1. append non-unique data to existing data ("append_non_unique"), 2. do not append data ("do_not_append")
		if (obj.append_text == "append_unique") {
			// --------------------------------
			// Purpose: for username storage
			// --------------------------------

			// Step 1: decrypt the file_contents
			obj = await this.decrypt_file(obj);
			
		       	// --------------------------------
			
			// Step 2: Perform query 0 - Determine if the text_input is in the file_contents
			console.log('****** Step 2: Perform query 0 - Determine if the text_input is in the file_contents ******');
			
			// [Query 0] Determine if username is in the database
			obj.query_search_result = await this.comparator_search_for_a_username(obj.decrypted_file_contents, obj.input_text_only);
			// console.log("obj.query_search_", obj.query_search_result);
		
			// --------------------------------
		
			// Step 3: Perform query 1 - Add the text_input to the file
			console.log('****** Step 3: Perform query 1 - Add the unique input_text to the file ******');
		
			// [Query 1] Add a unique input_text to the file
			if (obj.query_search_result == 'Not Present') {
				obj.decrypted_file_contents = obj.decrypted_file_contents + "\n" + obj.input_text_only;
				obj = await this.insert_data(obj);
				obj.query_insert_result = "Unique data added.";
			} else {
				obj.query_insert_result = "Data is Present, try again to input unique text data.";
			}
			
		} else if (obj.append_text == "append_non_unique") {
			// --------------------------------
			// Purpose: for text data to train models
			// --------------------------------
			
			// Step 1: decrypt the file_contents
			obj = await this.decrypt_file(obj);
			
		       	// --------------------------------
			
			obj.decrypted_file_contents = obj.decrypted_file_contents + "\n" + obj.input_text_only;
			obj = await this.insert_data(obj);
			obj.query_insert_result = "Non-unique data added.";

		} else if (obj.append_text == "do_not_append") {
			// --------------------------------
			// Purpose: for Frontend key updating
			// --------------------------------
			obj.decrypted_file_contents = obj.input_text_only;
			obj = await this.insert_data(obj);
			obj.query_insert_result = "New data added.";
		}
		delete obj.decrypted_file_contents;
		return obj;
	}

	// ------------------------------------------------

	async get_decrypted_file_data() {
		// view, return, get data
		
		var obj = await this.initialize_github();
		
		// ------------------------------------------------

		if (obj.type_of_encryption == "window_crypto_subtle") {
			// Step 0: convert the JSON Web key (Key_jwk_obj) to an object (Key_obj)
			obj = await this.initialize_window_crypto_subtle(obj);
			obj = await this.GET_public_private_keys(obj);
		}
	
		// ------------------------------------------------
	
		// Step 1: decrypt the file
		obj = await this.decrypt_file(obj);
	
		// ------------------------------------------------
	
		// Step 2: Return the decrypted contents of the file
		console.log('****** Step 2: Return the decrypted contents of the file ******');
		
		obj.query_view_result = "Finished: obj.decrypted_file_contents outputted";
		return obj;
	}

	// ------------------------------------------------

	async delete_file_contents() {
	
		var obj = await this.initialize_github();
		
		// ------------------------------------------------

		if (obj.type_of_encryption == "window_crypto_subtle") {
			// Step 0: convert the JSON Web key (Key_jwk_obj) to an object (Key_obj)
			obj = await this.initialize_window_crypto_subtle(obj);
			obj = await this.GET_public_private_keys(obj);
		}
		
		// ------------------------------------------------
	
		// Step 1: decrypt the file_contents
		obj = await this.decrypt_file(obj);
		
	       	// --------------------------------
	
		// Step 2: Delete the input_text from file_contents
		console.log('****** Step 2: Delete the input_text from file_contents ******');
		
		// Obtain username
		obj.username = obj.input_text.split('|').shift();
		// console.log("obj.username:", obj.username);
	
		// [Query 0] Determine if the text_input is in the file_contents
		obj.query_search_result = await this.comparator_search_for_a_username(obj.decrypted_file_contents, obj.username);
		// console.log("obj.query_search_", obj.query_search_result);
	
		// --------------------------------
	
		// Step 3: Perform query 1 - Remove the text_input from the file_contents
		console.log('****** Step 3: Perform query 1 - Remove the text_input from the file_contents ******');
		
		if (obj.query_search_result == 'Present') {
			obj = await this.remove_username(obj);
			
			// obj.env_text
			// obj.env_file_download_url
			// obj.env_sha
			obj.env_desired_path = obj.env_file_download_url.split('main/').pop();
			// console.log('obj.env_desired_path: ', obj.env_desired_path);
			obj.auth = obj.env_text; // Initialize value
	
			obj.file_download_url = obj.filedatabase_file_download_url;
			obj.put_message = 'resave database';
			obj.input_text = btoa(obj.encrypted_file_contents);
			obj.desired_path =  obj.filedatabase_file_download_url.split('main/').pop();
			obj.sha = obj.filedatabase_sha;
				
			obj = await this.decrypt_text_salt_scramble(obj);
			delete obj.Key_obj;
				
			obj.query_delete_result = "Username removed.";
		} else {
			obj.query_delete_result = "Username is Not Present, select another username to remove.";
		}
		delete obj.decrypted_file_contents;
		return obj;
	}

	// ------------------------------------------------

	async encrypt_text_string() {
	
		var obj = await this.initialize_github();
		
		// ------------------------------------------------

		if (obj.type_of_encryption == "window_crypto_subtle") {
			// Step 0: convert the JSON Web key (Key_jwk_obj) to an object (Key_obj)
			obj = await this.initialize_window_crypto_subtle(obj);
			obj = await this.GET_public_private_keys(obj);

			// Step 1: run an encryption method
			obj = await this.encrypt_text_window_crypto_subtle(obj);
			
		} else if (obj.type_of_encryption == "hexadecimal") {
			
			// Step 1: run an encryption method
			obj = await this.encrypt_text_hexadecimal(obj);
			
		} else if (obj.type_of_encryption == "salt_scramble") {

			// Step 1: run an encryption method
			obj = await this.encrypt_text_salt_scramble(obj);
		}

		return obj.encrypted_file_contents;
	}

	// ------------------------------------------------
	


	// ------------------------------------------------
	// DETAILED/LOWER-LEVEL PROCESS FUNCTIONS
	// ------------------------------------------------
	async convert_arr_to_str(arr, sep) {
		return arr.map((val, ind) => { 
			if (ind == 0) {
				return sep+val+sep; 
			} else {
				return val+sep;
			}
		}).join('');
	}
	
	// ------------------------------------------------
	
	async comparator_search_for_a_username(decrypted_file_contents, username) {
		
		let arr_db = decrypted_file_contents.split('\n');
		// console.log("arr_db:", arr_db);
		
		// Make usernames unique by adding | before and after each username
		const arr_db_uq_str = await this.convert_arr_to_str(arr_db, "|");
		// console.log("arr_db_uq_str:", arr_db_uq_str);
		
		// Search for a unique username
	  	let regex = new RegExp(`\\|${username}\\|`, 'g');
		// console.log("regex: ", regex);
		
		// true=name is present in database, false=name is not present in database
		// console.log("regex.test(arr_db_uq_str):", regex.test(arr_db_uq_str));
		
		if (regex.test(arr_db_uq_str) == true) {
			return 'Present';
		} else {
			return 'Not Present';
		}
	}
	
	// ------------------------------------------------
	
	async remove_username(obj) {
		
		obj.decrypted_file_contents_arr = obj.decrypted_file_contents.split('\n');
		// console.log("obj.decrypted_file_contents_arr:", obj.decrypted_file_contents_arr);
		
		// Make usernames unique by adding | before and after each username
		obj.decrypted_file_contents = await this.convert_arr_to_str(obj.decrypted_file_contents_arr, "|");
		// console.log("obj.decrypted_file_contents:", obj.decrypted_file_contents);
		
		// Search for a unique username
	  	let regex = new RegExp(`\\|${obj.username}\\|`, 'g');
		// console.log("regex: ", regex);
	
		// Undo the convert_arr_to_str transformation
		obj.decrypted_file_contents_arr = obj.decrypted_file_contents.replace(regex, '|').split('|');
		// console.log("obj.decrypted_file_contents_arr: ",  obj.decrypted_file_contents_arr);
		
		obj = await this.decrypted_file_contents_arr_to_str(obj);
		
		return await this.encrypt_text_window_crypto_subtle(obj);
	}
	
	// ------------------------------------------------
	
	async decrypted_file_contents_arr_to_str(obj) {
	
		// Remove empty spaces
		const NonEmptyVals_toKeep = (x) => x.length != 0;
		obj.decrypted_file_contents_arr = obj.decrypted_file_contents_arr.filter(NonEmptyVals_toKeep);
		// console.log("obj.decrypted_file_contents_arr: ",  obj.decrypted_file_contents_arr);
		
		obj.decrypted_file_contents = obj.decrypted_file_contents_arr.map((val, ind) => { 
			if (ind < obj.decrypted_file_contents_arr.length-1) {
				return val+"\n";
			} else {
				return val;
			}
		}).join('');
	
		return obj;
	}

	// ------------------------------------------------
	
	async insert_data(obj) {

		obj.decrypted_file_contents_arr = obj.decrypted_file_contents.split('\n');
		obj = await this.decrypted_file_contents_arr_to_str(obj);

		if (obj.type_of_encryption == "window_crypto_subtle") {
			await this.encrypt_text_window_crypto_subtle(obj);
		} else if (obj.type_of_encryption == "hexadecimal") {
			await this.encrypt_text_hexadecimal(obj);
		}
			
		// Save updated file
		// obj.env_text
		// obj.env_file_download_url
		// obj.env_sha
		obj.env_desired_path = obj.env_file_download_url.split('main/').pop();
		// console.log('obj.env_desired_path: ', obj.env_desired_path);
		obj.auth = obj.env_text; // Initialize value

		obj.file_download_url = obj.filedatabase_file_download_url;
		obj.put_message = 'resave file';
		obj.input_text = btoa(obj.encrypted_file_contents);
		obj.desired_path =  obj.filedatabase_file_download_url.split('main/').pop();
		obj.sha = obj.filedatabase_sha;
			
		obj = await this.decrypt_text_salt_scramble(obj);
		delete obj.Key_obj;
		
		return obj;
	}
	
	// ------------------------------------------------

	async GET_public_private_keys(obj) {
		
		console.log('****** Step 0: convert the JSON Web key (Key_jwk_obj) to an object (Key_obj) ******');
		// obj.public_text
		// obj.public_file_download_url
		// obj.public_sha
		obj.public_desired_path = obj.public_file_download_url.split('main/').pop();
		obj.auth = obj.public_text; // Initialize value
		obj = await this.decrypt_text_salt_scramble(obj);
		obj.publicKey_obj = obj.Key_obj;
		delete obj.Key_obj;
	
		// obj.private_text
		// obj.private_file_download_url
		// obj.private_sha
		obj.private_desired_path = obj.private_file_download_url.split('main/').pop();
		obj.auth = obj.private_text; // Initialize value
		obj = await this.decrypt_text_salt_scramble(obj);
		obj.privateKey_obj = obj.Key_obj;
		delete obj.Key_obj;
		
		return obj;
	}

	// ------------------------------------------------

	async decrypt_file(obj) {

		console.log('****** Step 1: decrypt the file_contents ******');
		var obj_filedatabase = await GET_text_from_file_wo_auth_GitHub_RESTAPI(obj.filename, obj.foldername, obj.repoB_name, obj.repoOwner)
		// console.log('obj_filedatabase: ', obj_filedatabase);
		
		obj.encrypted_file_contents = atob(obj_filedatabase.text);
		obj.filedatabase_file_download_url = obj_filedatabase.file_download_url;
		obj.filedatabase_sha = obj_filedatabase.sha;
	
		obj.decrypted_file_contents = "";
		if (obj.encrypted_file_contents.length > 1) {

			if (obj.type_of_encryption == "window_crypto_subtle") {
				obj = await this.decrypt_text_window_crypto_subtle(obj);
			} else {
				obj = await this.decrypt_text_hexadecimal(obj);
			}
		}
	
		return obj;
	}
	
	// ------------------------------------------------
	
	

	
	// ------------------------------------------------
	// Encryption method 0: version 0 WITHOUT libsodium-wrappers
	// ------------------------------------------------
	async function create_salt(obj) {
	
		// Resalt and save the key in .env, for the next time
		var alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		var num = '0123456789';
		let alpha_arr = alpha.split('');
		let num_arr = num.split('');
	
		// --------------------------------
		
		// Determine the salt length - it can be up to length n
		// Configuration 0: [1 to n]
		// first part is [0 to n-1], we do not want 0 so shift it by one [1 to n]
		// var new_salt_length = Math.round(Math.random())*(n-1) + 1;
		// OR
		// Configuration 1: [no_salt to n]
		var new_salt_length = Math.round(Math.random())*n;
		// console.log('new_salt_length: ', new_salt_length);
	
		// --------------------------------
	
		if (new_salt_length > 0) {
			// Fill a vector new_salt_length long with 0 or 1; 0=salt a letter, 1=salt a number
			var letnum_selection = [];
			for (let i=0; i<new_salt_length; i++) { 
				letnum_selection.push(Math.round(Math.random())); 
			}
			// console.log('letnum_selection: ', letnum_selection);
		
			// --------------------------------
			
			// Create salt (extra strings randomly)
			obj.salt = letnum_selection.map((row) => { 
		              if (row == 0) { 
		                let val = Math.round(Math.random()*alpha_arr.length);
		                // console.log('val: ', val);
		                return alpha_arr[val]; 
		              } else { 
		                let val = Math.round(Math.random()*num_arr.length);
		                // console.log('val: ', val);
		                return num_arr[val]; 
		              } 
			});
		
			obj.salt = obj.salt.join('');
		} else {
			obj.salt = "";
		}
	
		return obj;
	}

	// ------------------------------------------------

	async encrypt_text_salt_scramble(obj) {

		obj = await this.create_salt(obj);
		
		// Add salt
		if (Math.round(Math.random()) == 0) {
			// salt front
			obj.decrypted_file_contents = obj.salt+obj.decrypted_file_contents;
		} else {
			// salt back
			obj.decrypted_file_contents = obj.decrypted_file_contents+obj.salt;
		}
		delete obj.salt;
	
		// --------------------------------
		
		// Scramble : Github automatically base64 decodes and searches the strings and can find the key, causing GitHub to disactivate the key automatically for security
		// obtain even values of string
		let ep = obj.decrypted_file_contents.map((val) => { if (val % 2 == 0) { return val; } });
	
		// obtain odd values of string
		let ap = obj.decrypted_file_contents.map((val) => { if (val % 2 != 0) { return val; } });
	
		obj.encrypted_file_contents = ep + "|" + ap;
		// console.log('obj.encrypted_file_contents:', obj.encrypted_file_contents);

		return obj;
	}

	// ------------------------------------------------

	async decrypt_text_salt_scramble(obj) {
	
		obj.status = 404; // Initialize value
			
		// [2] Loop over the number of possible values
		let i = 0;
		var x = Array.from({ length: (obj.n*2)+1 }, (_, ind) => ind);
		var x_rand = await rand_perm(x);
		
		// console.log('x: ', x);
		// console.log('x_rand: ', x_rand);
		
		while ((/^20/g).test(obj.status) == false && obj.auth != null && i < (obj.n*2)+1) {
			
			obj = await decode_desalt(obj,  x_rand[i])
				.then(async function(obj) {
					
					// console.log('obj.auth: ', obj.auth.slice(0,5));
					try {
						// A process to determine if it is the correct key: it will throw an error if the key is incorrect
						// Step 0: convert the JSON Web key (Key_jwk_obj) to an object (Key_obj)
						if ((/encrypt/g).test(obj.auth) == true) {
							// console.log('JWT public key');
							obj.Key_obj = await window.crypto.subtle.importKey("jwk", JSON.parse(obj.auth), {name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: "SHA-256"} }, true, ["encrypt"]);
							obj.status = 200;
							
						} else if ((/decrypt/g).test(obj.auth) == true) {
							// console.log('JWT private key');
							obj.Key_obj = await window.crypto.subtle.importKey("jwk", JSON.parse(obj.auth), {name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: {name: "SHA-256"} }, true, ["decrypt"]);
							obj.status = 200;
							
						} else {
							console.log('Github key');
							if (obj.file_download_url == "No_file_found") {
								// Option 0: create a new file
							  	obj.status = await PUT_create_a_file_RESTAPI(obj.auth, obj.put_message, obj.input_text, obj.foldername+"/"+obj.filename, obj.repoB_name, obj.repoOwner)
							 		.then(async function(out) { return out.status; })
				 			 		.catch(error => { console.log("error: ", error); });
					 		} else {
								// Option 1: modify an existing file
						 	 	obj.status = await PUT_add_to_a_file_RESTAPI(obj.auth, obj.put_message, obj.input_text, obj.desired_path, obj.sha, obj.repoB_name, obj.repoOwner)
							 		.then(async function(out) { return out.status; })
				 			 		.catch(error => { console.log("error: ", error); });
					 		}
						}
						
					} catch (error) {
						// console.log('error: ', error);
						obj.status = 404; 
					}
					return obj;
				})
				.then(async function(obj) {
					// console.log("obj.status:", obj.status);
					
					if ((/^20/g).test(obj.status) == true) {
						// console.log("Match found");
						if ((/encrypt/g).test(obj.auth) == false && (/decrypt/g).test(obj.auth) == false) {
							obj.Key_obj = obj.auth;
						}
						delete obj.auth; // the variable is deleted to force it to stop the loop as quickly as possible, it will then throw an error for the while loop thus the while loop is called in a try catch to prevent errors.
					} else {
						if ((/encrypt/g).test(obj.auth) == true) {
							obj.auth = obj.public_text; // reinitialize value to keep the value obj.auth non-visible
						} else if ((/decrypt/g).test(obj.auth) == true) {
							obj.auth = obj.private_text; // reinitialize value to keep the value obj.auth non-visible
						} else {
							obj.auth = obj.env_text; // reinitialize value to keep the value obj.auth non-visible
						}
					}
					
					return obj;
				})
				.then(async function(obj) { await new Promise(r => setTimeout(r, 2000)); return obj; })
			
			// Advance while loop
			// console.log("loop i: ", i);
			// console.log("x_rand[i]: ", x_rand[i]);
			i += 1;	
		}
		return obj;
	}
	
	// ------------------------------------------------


	// ------------------------------------------------
	// Encryption method 0: version 1 WITH libsodium-wrappers
	// ------------------------------------------------
	

  
	// ------------------------------------------------
	// Encryption method 1
	// ------------------------------------------------
	async encrypt_text_window_crypto_subtle(obj) {
	
		// console.log('Database before encrypting: ', obj.decrypted_file_contents);
	
		// Convert string to UTF-8 array [non-fixed length array]
		// So that the text can be stored as a common character/number (that many different systems can understand/decode)
		const uint8Array = new TextEncoder().encode(obj.decrypted_file_contents);
		// console.log('uint8Array:', uint8Array);
	
		// Convert UTF-8 array [non-fixed length array] to a binary arrayBuffer [fixed-length array]
		const arrayBuffer = uint8Array.buffer;
		// console.log("arrayBuffer:", arrayBuffer);
	                
		// Encode with respect to publicKey encryption method : transform arrayBuffer [fixed-length array] via the algorithm
		let data_encoded_arrayBuffer = await window.crypto.subtle.encrypt({name: "RSA-OAEP"}, obj.publicKey_obj, arrayBuffer);
		// console.log('data_encoded_arrayBuffer:', data_encoded_arrayBuffer);
	
		delete obj.publicKey_obj;
		
		// Convert arrayBuffer [fixed-length array] to UTF-8 array [non-fixed length array]
		const uint8Array_out = new Uint8Array(data_encoded_arrayBuffer);
		// console.log('uint8Array_out:', uint8Array_out);
		
		// Convert UTF-8 array [non-fixed length array] to hexadecimal string
		obj.encrypted_file_contents = await this.convert_uint8Array_to_hexstr(uint8Array_out);
		// console.log('obj.encrypted_file_contents:', obj.encrypted_file_contents);
		
		return obj;
	}
	
	// ------------------------------------------------
		
	async decrypt_text_window_crypto_subtle(obj) {
		
		// Convert hexadecimal string to a UTF-8 array [non-fixed length array] where the length is 256
		const uint8Array = await this.convert_hexstr_to_uint8Array(obj.encrypted_file_contents);
		// console.log('uint8Array:', uint8Array);
		
		// Convert UTF-8 array [non-fixed length array] to a binary arrayBuffer [fixed-length array]
		const arrayBuffer = uint8Array.buffer;
		// console.log('arrayBuffer:', arrayBuffer);
		
		// Decode with respect to privateKey encryption method : transform arrayBuffer [fixed-length array] via the algorithm
		let data_decoded_arrayBuffer = await window.crypto.subtle.decrypt({name: "RSA-OAEP"}, obj.privateKey_obj, arrayBuffer);
		// console.log("data_decoded_arrayBuffer:", data_decoded_arrayBuffer);
	
		delete obj.privateKey_obj;
		
		// Convert arrayBuffer [fixed-length array] to UTF-8 array [non-fixed length array]
		const uint8Array_out = new Uint8Array(data_decoded_arrayBuffer);
		// console.log('uint8Array_out:', uint8Array_out);
	
		// Convert UTF-8 array [non-fixed length array] to text
		obj.decrypted_file_contents = new TextDecoder().decode(uint8Array_out);
	
		return obj;
	}
	
	// ------------------------------------------------

  
	// ------------------------------------------------
	// Encryption method 2
	// ------------------------------------------------
	async encrypt_text_hexadecimal(obj) {
	
		// console.log('Database before encrypting: ', obj.decrypted_file_contents);
	
		// Convert string to UTF-8 array [non-fixed length array]
		// So that the text can be stored as a common character/number (that many different systems can understand/decode)
		const uint8Array = new TextEncoder().encode(obj.decrypted_file_contents);
		// console.log('uint8Array:', uint8Array);
	
		// Convert UTF-8 array [non-fixed length array] to a binary arrayBuffer [fixed-length array]
		const arrayBuffer = uint8Array.buffer;
		// console.log("arrayBuffer:", arrayBuffer);
		
		// Convert arrayBuffer [fixed-length array] to UTF-8 array [non-fixed length array]
		const uint8Array_out = new Uint8Array(arrayBuffer);
		// console.log('uint8Array_out:', uint8Array_out);
		
		// Convert UTF-8 array [non-fixed length array] to hexadecimal string
		obj.encrypted_file_contents = await this.convert_uint8Array_to_hexstr(uint8Array_out);
		// console.log('obj.encrypted_file_contents:', obj.encrypted_file_contents);
		
		return obj;
	}
  
	// ------------------------------------------------
		
	async decrypt_text_hexadecimal(obj) {
		
		// Convert hexadecimal string to a UTF-8 array [non-fixed length array] where the length is 256
		const uint8Array = await this.convert_hexstr_to_uint8Array(obj.encrypted_file_contents);
		// console.log('uint8Array:', uint8Array);
		
		// Convert UTF-8 array [non-fixed length array] to a binary arrayBuffer [fixed-length array]
		const arrayBuffer = uint8Array.buffer;
		// console.log('arrayBuffer:', arrayBuffer);
		
		// Convert arrayBuffer [fixed-length array] to UTF-8 array [non-fixed length array]
		const uint8Array_out = new Uint8Array(arrayBuffer);
		// console.log('uint8Array_out:', uint8Array_out);
	
		// Convert UTF-8 array [non-fixed length array] to text
		obj.decrypted_file_contents = new TextDecoder().decode(uint8Array_out);
	
		return obj;
	}
	
	// ------------------------------------------------
	
	async convert_hexstr_to_uint8Array(hexString) {
		// Convert a Hexadecimal string to an Array
		let arr_out = hexString.split('').map((val, ind) => {
		if (ind % 2 != 0) {
				return parseInt(hexString.slice(ind-1, ind+1), 16);
			} else {
				return '';
			}
		});
		const NonEmptyVals_toKeep = (x) => x.length != 0;
		const arr = arr_out.filter(NonEmptyVals_toKeep);
		const uint8Array = new Uint8Array(arr);
		return uint8Array;
	}
	
	// ------------------------------------------------
	
	async convert_uint8Array_to_hexstr(uint8Array) {
		var hexString = Array.prototype.map.call(uint8Array, x => ('00' + x.toString(16)).slice(-2)).join('');
		return hexString.replace(/[^a-zA-Z0-9]/g, ''); // remove "noise" from conversion (non-alphanumeric characters), there should be nothing removed in theory but done just in case
	}
	
	// ------------------------------------------------


}
