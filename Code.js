let skipedUsersSheetId = '1nqNJuZRfTD8PxzNsyqVuc9064StP0u4vgMRT_LRl0po';

function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function generateListOfUsers(settingsDTO) {
  //settingsDTO = {noOfUsers: 2, organizationUnit: '/Roche/Suspended_Accounts'};  

  let ss = SpreadsheetApp.openById(skipedUsersSheetId).getSheets()[0];
  let skipedUsersList = ss.getRange(1,1,ss.getLastRow()).getValues().map(row => row[0]);

  let usersListDTO = sendRequestForUsers(settingsDTO, null);

  let filteredUsers = [];
  do{
  let usersList = usersListDTO.users.map(user => user.primaryEmail.toLowerCase());
  let nextPageToken = usersListDTO.nextPageToken;

  filteredUsers = usersList.filter(user => !skipedUsersList.includes(user)).concat(filteredUsers);
  if(nextPageToken == null){
    return filteredUsers;
  }
  usersListDTO = sendRequestForUsers(settingsDTO, nextPageToken);
  
  }while(filteredUsers.length <= settingsDTO.noOfUsers)

  if(filteredUsers.length > settingsDTO.noOfUsers){
    return filteredUsers.slice(0, settingsDTO.noOfUsers);
  } else {
    return filteredUsers;
  }
}

function sendRequestForUsers(settingsDTO, nextPageToken) {
  let customerId = AdminDirectory.Users.get(Session.getActiveUser().toString()).customerId;
  let usersList = AdminDirectory.Users.list({
    customer: customerId,
    pageToken: nextPageToken != null ? nextPageToken : null,
    maxResults: 500,
    query: 'orgUnitPath='+settingsDTO.organizationUnit+' isSuspended=true isAdmin=false'
   });

  return usersList;
}

function createSheet(usersListDTO, destinationFolder) {
  //usersListDTO = ['2pleasanton.ibltest2@roche.com','aakash.sengupta@businesspartner.roche.com']
  //destinationFolder = '1-tRp08iTZgudVzxCHgEMKWMiFZhsBj6O'
  usersListDTO = usersListDTO.map(user => [user]);

  let ss = SpreadsheetApp.create("Reclaimer list - "+new Date(Date.now()));
  let sheet = ss.getSheets()[0];
  sheet.getRange(1,1,usersListDTO.length).setValues(usersListDTO);
  if(destinationFolder.localeCompare("") != 0){
    DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(destinationFolder));
  }
  Logger.log(ss.getId())
  Logger.log(DriveApp.getFileById(ss.getId()).getDownloadUrl())
  return DriveApp.getFileById(ss.getId()).getUrl();
}

function getSettings(){
  let ss = SpreadsheetApp.openById(skipedUsersSheetId).getSheets()[1];
  return ss.getRange('B1').getValue();
}

function updateDefaultFolderId(destinationFolder) {
  let ss = SpreadsheetApp.openById(skipedUsersSheetId).getSheets()[1];
  return ss.getRange('B1').setValue(destinationFolder);
}

function getSkippedFile() {
  return SpreadsheetApp.openById(skipedUsersSheetId).getUrl();
}