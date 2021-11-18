// Vue client side service - receive document, upload to AWS for processing through API and return optimised document
// visit app.halftoner.com for live demo

const MAX_FILE_SIZE = 10 * 1000 * 1000;
const MAX_LENGTH = 2480;
const API_ENDPOINT =
  "https://[-----].amazonaws.com/uploads";
const EDITOR_API =
  "https://[-----].amazonaws.com/default/CV2";
const FEEDBACK_API =
  "https://[-----].amazonaws.com/default/sendFeedback";

new Vue({
  el: "#app",
  data() {
    return {
      file: "",
      type: "",
      printtype: "",
      ext: "",
      name: "",
      display: "",
      before: "",
      after: "",
      uploadURL: "",
      inksaved: "",
      pages: "",
      progress: 0,
      crop: false,
      pagescan: false,
      showAlert: false,
      contact: false,
      close: false,
      sent: false,
      isAfter: false,
      alert: "",
      wait: "",
      message: "",
      email: ""
    };
  },
  props: {
    uploading: { Type: Boolean, default: false },
    crash: { Type: Boolean, default: false },
    terms: { Type: Boolean, default: false }
  },

// after the app has been mounted, check if the user already agreed to the service Terms and Conditions, and if so hide the releveant popup
  mounted() {
    if (localStorage.terms) {
      this.terms = localStorage.terms;
      if (this.terms) {
        console.log("Accepted Terms Already");
      }
    }
  },

// user feedback form - disable the ability to send the form until all fields are complete
  computed: {
    isDisabled: function() {
      return !this.message || !this.email;
    }
  },
  methods: {

// First step - the user selects a document either jpg or pdf

    onChange(e) {
      let files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;
      this.type = files[0]["type"];
      this.ext = this.type.split("/").pop();
      if (this.ext == "pdf") {
        this.printtype = "pdf";
        this.countpages(files[0]);
        this.createFile(files[0]);
      } else {
        this.printtype = "image";
        this.pages = 1;
        this.createFile(files[0]);
      }
    },

// Upload verification process - up to 10MB, 14 pages and only JPG or PDF
    createFile(file) {
      // var image = new Image()
      let reader = new FileReader();
      reader.onload = e => {
        if (this.ext != "jpeg" && this.ext != "pdf") {
          this.showAlert = true;
          this.alert = "Select PDF or JPEG";
          return;
        }
        console.log(`the file size is ${file.size / (1000 * 1000)} MB`);
        if (file.size > MAX_FILE_SIZE) {
          this.showAlert = true;
          this.alert = "Up to 10MB";
          return;
        }
        if (this.pages <= 14) {
          this.file = e.target.result;

// Reduce image dimension for large photos to speed up the process

          if (this.ext == "jpeg") {
            let img = new Image();
            img.src = this.file;
            console.log("File selected: ", file.name);
            img.onload = () => {
              var canvas = document.createElement("canvas"),
                width = img.width,
                height = img.height;
              console.log(`Dimensions: ${width}x${height}`);
              if (width > height) {
                if (width > MAX_LENGTH) {
                  height *= MAX_LENGTH / width;
                  width = MAX_LENGTH;
                }
              } else {
                if (height > MAX_LENGTH) {
                  width *= MAX_LENGTH / height;
                  height = MAX_LENGTH;
                }
              }
              canvas.width = width;
              canvas.height = height;
              canvas.getContext("2d").drawImage(img, 0, 0, width, height);
              this.file = canvas.toDataURL("image/jpeg");
            };
          }
          this.name =
            file.name.substr(0, file.name.lastIndexOf(".")) +
            "-new." +
            this.ext;
          this.display = this.file;
          this.before = this.file;
        } else {
          this.showAlert = true;
          this.alert = "Up to 14 pages";
          return;
        }
      };
      reader.readAsDataURL(file);
    },

// for PDF, count the number of pages 

    countpages(file) {
      let reader = new FileReader();
      reader.readAsBinaryString(file);
      reader.onload = e => {
        try {
          this.pages = reader.result.match(/\/Type[\s]*\/Page[^s]/g).length;
          console.log("Number of Pages: ", this.pages);
        } catch {
          this.pages = 1;
        }
      };
    },


// Second step - begin upload and processing, display loading screen to the user  

    uploadFile: async function(e) {
      console.log("Upload clicked");
      let timestep = 500;
      if (this.pages > 5) {
        timestep = 1500;
      } else if (this.pages > 2) {
        timestep = 1000;
      }
      this.uploading = true;
      this.reseted = false;
      let interval = setInterval(() => {
        if (this.progress >= 100 || this.reseted) {
          clearInterval(interval);
        } else if (this.inksaved != "") {
          this.progress = 100;
        } else {
          if (this.progress == 75) {
            this.wait = "Just a few more moments";
            timestep = 1500;
          }
          this.progress += 1;
          console.log(this.progress);
        }
      }, timestep);
      this.wait = "Analyzing your file";

// Third step - Secure upload with presigned URLs, generate the URL

      const response = await axios({
        method: "POST",
        url: API_ENDPOINT,
        data: { type: this.type }
      }).catch(error => {
        console.log(error);
        this.reset();
        return alert("Connection Error");
      });
      console.log("Upload Started");


// Fourth step - convert file into blob and upload to presigned URL

      let binary = atob(this.file.split(",")[1]);
      let array = [];
      for (var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      let blobData = new Blob([new Uint8Array(array)], {
        type: this.type
      });
      console.log("Your document is being processed");
      this.wait = "It won't take long";
      this.progress += 5;
      let key = response.data.pdfKey;
      let edited = "";
      let crop = + this.crop
      console.log('Auto-Crop: ', crop)
      let pagescan = + this.pagescan
      console.log('Page Scan: ', pagescan)

      const result = await fetch(response.data.uploadURL, {
        method: "PUT",
        body: blobData
      }).then(async res => {
        edited = await axios({
          method: "POST",
          url: EDITOR_API,
          params: { fullname: key, crop: crop, pagescan: pagescan }
        }).catch(error => {
          console.log(error);
          this.reset();
          return alert("There was a problem, please try another file");
        });
      });

// Final step - the file is processed immediately after upload and the result is returned to the client
// the result is a processed document and the amount of savings

      console.log("Completed processing, starting download");
      this.wait = "Almost done";
      if (this.progress <= 60) {
        this.progress += 20;
      } else if (this.progress <= 80) {
        this.progress += 5;
      }

      let url = edited.data.URL;
      axios.get(url, { responseType: "arraybuffer" }).then(download => {
        console.log("Done with the download");
        let newfile = new Blob([download.data], { type: this.type });
        this.display = URL.createObjectURL(newfile);
        this.after = URL.createObjectURL(newfile);
        this.isAfter = true;
        this.inksaved = parseFloat(edited.data.Ink);
        if (this.inksaved == 0) {
          this.inksaved = -1;
        }
        console.log("Ink Saved (%): ", this.inksaved);
      });
    },
    toggle() {
      if (!this.isAfter) {
        this.isAfter = true;
        this.display = this.after;
      } else {
        this.isAfter = false;
        this.display = this.before;
      }
    },
    updateterms() {
      this.terms = true;
      localStorage.terms = this.terms;
      console.log("Accepted Terms");
    },
    send() {
      this.sent = true;
      console.log("Message Sent");
      let body = { feedback: this.message, mail: this.email };
      axios({
        method: "POST",
        url: FEEDBACK_API,
        data: body,
        headers: { "Content-Type": "application/json" }
      }).then(res => {
        console.log(res.data);
      });
      this.message = "";
      this.email = "";
    },

    closecontact() {
      this.contact = false;
      this.message = "";
      this.email = "";
    },

    print: function(e) {
      console.log("Printing");
      printJS({
        printable: this.display,
        type: this.printtype,
        showModal: true
      });
    },

    reset: function(e) {
      console.log("Reset");
      this.file = "";
      this.type = "";
      this.printtype = "";
      this.ext = "";
      this.name = "";
      this.display = "";
      this.before = "";
      this.after = "";
      this.wait = "";
      this.uploadURL = "";
      this.inksaved = "";
      this.progress = 0;
      this.crop = false;
      this.pagescan = false;
      this.sent = false;
      this.pages = "";
      this.uploading = false;
      this.close = false;
      this.reseted = true;
      this.isAfter = false;
    }
    // END of Methods
  }
});
